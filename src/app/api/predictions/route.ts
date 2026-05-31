// POST /api/predictions
// Submit or update a prediction for a fixture.
// Server-side kickoff lock: rejected if current time >= fixture.kickoff_utc.
// Requires Firebase ID token in Authorization header.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { PredictionResult } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_RESULTS: PredictionResult[] = ['H', 'D', 'A'];

export async function POST(request: NextRequest) {
  // 1. Verify Firebase ID token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  let uid: string;

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Parse and validate request body
  let body: { fixture_id: number; predicted_result: PredictionResult };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { fixture_id, predicted_result } = body;

  if (!fixture_id || typeof fixture_id !== 'number') {
    return NextResponse.json({ error: 'fixture_id must be a number' }, { status: 400 });
  }

  if (!VALID_RESULTS.includes(predicted_result)) {
    return NextResponse.json(
      { error: `predicted_result must be one of: ${VALID_RESULTS.join(', ')}` },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();

  // 3. Fetch fixture — check it exists and kickoff hasn't passed
  const fixtureRef = db.doc(`fixtures/${fixture_id}`);
  const fixtureSnap = await fixtureRef.get();

  if (!fixtureSnap.exists) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  const fixture = fixtureSnap.data()!;
  const kickoffUtc = new Date(fixture.kickoff_utc);
  const now = new Date();

  // SERVER-SIDE LOCK: never trust the client
  if (now >= kickoffUtc) {
    return NextResponse.json(
      {
        error: 'Prediction locked — match has already kicked off',
        locked_at: kickoffUtc.toISOString(),
      },
      { status: 403 }
    );
  }

  // Also reject if fixture is already live or finished
  const blockedStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'FT', 'AET', 'PEN', 'VOID'];
  if (blockedStatuses.includes(fixture.status)) {
    return NextResponse.json(
      { error: `Cannot predict — fixture status is ${fixture.status}` },
      { status: 403 }
    );
  }

  // 4. Write prediction to Firestore
  // Document ID: {uid}_{fixtureId} — enables direct get() lookup, no query needed
  const predictionRef = db.doc(`predictions/${uid}_${fixture_id}`);

  try {
    await predictionRef.set(
      {
        user_id: uid,
        fixture_id,
        predicted_result,
        editable: true,
        points_earned: 0,
        is_correct: null,
        submitted_at: FieldValue.serverTimestamp(),
      },
      { merge: true } // Overwrite prediction if exists (user changed their pick)
    );

    return NextResponse.json({
      success: true,
      prediction: {
        fixture_id,
        predicted_result,
        editable: true,
      },
    });
  } catch (err) {
    console.error('[/api/predictions] Firestore write error:', err);
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
  }
}
