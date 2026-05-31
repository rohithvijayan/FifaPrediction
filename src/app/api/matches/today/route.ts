// GET /api/matches/today
// Returns today's fixtures (IST date) with the calling user's prediction state.
// Requires Firebase ID token in Authorization header.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { getFixturesByDate, getISTDate } from '@/lib/api-football';
import { Fixture, Prediction, FixtureWithPrediction } from '@/lib/types';

export async function GET(request: NextRequest) {
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

  // 2. Get today's IST date
  const today = getISTDate(new Date().toISOString());

  try {
    const db = getAdminFirestore();

    // 3. First try Firestore (seeded by FixtureSeedCron)
    let fixtures: Fixture[] = [];
    const fixturesSnap = await db
      .collection('fixtures')
      .where('match_date', '==', today)
      .orderBy('kickoff_utc', 'asc')
      .get();

    if (!fixturesSnap.empty) {
      fixtures = fixturesSnap.docs.map((doc) => doc.data() as Fixture);
    } else {
      // 4. Fallback: fetch from API-Football (via cache)
      fixtures = await getFixturesByDate(today);
    }

    // 5. Fetch user's predictions for these fixtures
    const fixtureIds = fixtures.map((f) => f.fixture_id);
    const predictionPromises = fixtureIds.map((fid) =>
      db.doc(`predictions/${uid}_${fid}`).get()
    );
    const predictionDocs = await Promise.all(predictionPromises);

    const predictionsMap = new Map<number, Prediction>();
    predictionDocs.forEach((doc) => {
      if (doc.exists) {
        const pred = doc.data() as Prediction;
        predictionsMap.set(pred.fixture_id, pred);
      }
    });

    // 6. Merge fixtures with user predictions
    const fixturesWithPredictions: FixtureWithPrediction[] = fixtures.map((fixture) => ({
      ...fixture,
      user_prediction: predictionsMap.get(fixture.fixture_id),
    }));

    return NextResponse.json({
      date: today,
      fixtures: fixturesWithPredictions,
    });
  } catch (err) {
    console.error('[/api/matches/today] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
