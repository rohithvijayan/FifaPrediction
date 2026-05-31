// POST /api/admin/settle
// Admin-only: manually trigger result settlement for a specific fixture_id.
// Protected by ADMIN_UID env var check (Firebase UID).

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { getFixtureResult } from '@/lib/api-football';
import { settleFixture } from '@/lib/scoring';
import { Fixture, Prediction } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  // 1. Verify Firebase token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Check admin access
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid || uid !== adminUid) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  // 3. Parse body
  let body: { fixture_id: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { fixture_id } = body;
  if (!fixture_id) {
    return NextResponse.json({ error: 'fixture_id required' }, { status: 400 });
  }

  const db = getAdminFirestore();

  try {
    // 4. Fetch fixture from Firestore
    const fixtureSnap = await db.doc(`fixtures/${fixture_id}`).get();
    if (!fixtureSnap.exists) {
      return NextResponse.json({ error: 'Fixture not found in Firestore' }, { status: 404 });
    }

    let fixture = fixtureSnap.data() as Fixture;

    // 5. If result is null, fetch from API
    if (!fixture.result) {
      const freshFixture = await getFixtureResult(fixture_id);
      if (!freshFixture?.result) {
        return NextResponse.json({
          error: 'Match has not finished yet — no result available from API-Football',
        }, { status: 422 });
      }
      fixture = freshFixture;
      await fixtureSnap.ref.set({ result: fixture.result, status: fixture.status }, { merge: true });
    }

    // 6. Fetch all predictions for this fixture
    const predsSnap = await db
      .collection('predictions')
      .where('fixture_id', '==', fixture_id)
      .get();

    if (predsSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No predictions to settle for this fixture',
        fixture_id,
      });
    }

    const predictions = predsSnap.docs.map((doc) => ({
      _id: doc.id,
      ...(doc.data() as Prediction),
    }));

    // 7. Score and batch-write
    const scored = settleFixture(fixture, predictions);
    const batch = db.batch();

    for (const result of scored) {
      const predRef = db.doc(`predictions/${result.prediction_id}`);
      batch.update(predRef, {
        is_correct: result.is_correct,
        points_earned: result.points_earned,
        editable: false,
      });

      const userRef = db.doc(`users/${result.user_id}`);
      batch.update(userRef, {
        total_points: FieldValue.increment(result.points_earned),
        correct_predictions: result.is_correct ? FieldValue.increment(1) : FieldValue.increment(0),
      });
    }

    batch.update(fixtureSnap.ref, { _manually_settled_at: new Date().toISOString() });
    await batch.commit();

    return NextResponse.json({
      success: true,
      fixture_id,
      result: fixture.result,
      predictions_settled: scored.length,
      correct: scored.filter((s) => s.is_correct).length,
      wrong: scored.filter((s) => !s.is_correct).length,
    });
  } catch (err) {
    console.error('[/api/admin/settle] Error:', err);
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 });
  }
}
