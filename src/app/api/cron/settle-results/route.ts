// GET /api/cron/settle-results
// Scheduled: */5 * * * * (every 5 minutes)
// Detects FT fixtures → runs scoring engine → updates user.total_points atomically.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getFixtureResult } from '@/lib/api-football';
import { settleFixture } from '@/lib/scoring';
import { Fixture, Prediction } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const settledFixtures: number[] = [];
  const errors: string[] = [];

  try {
    // 1. Find all LIVE or recently-ended fixtures that haven't been settled yet
    const fixturesSnap = await db
      .collection('fixtures')
      .where('status', 'in', ['FT', 'AET', 'PEN'])
      .where('result', '!=', null)
      .get();

    if (fixturesSnap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No FT fixtures to settle',
        ran_at: new Date().toISOString(),
      });
    }

    for (const fixtureDoc of fixturesSnap.docs) {
      const fixture = fixtureDoc.data() as Fixture;

      // Skip if already settled (all predictions have is_correct set)
      // We check by looking for any unsettled prediction for this fixture
      const unsettledPreds = await db
        .collection('predictions')
        .where('fixture_id', '==', fixture.fixture_id)
        .where('is_correct', '==', null)
        .get();

      if (unsettledPreds.empty) continue; // Already fully settled

      // 2. Get verified result from API (or use Firestore value if already FT)
      let verifiedFixture: Fixture = fixture;
      if (fixture.result === null) {
        const freshFixture = await getFixtureResult(fixture.fixture_id);
        if (!freshFixture?.result) continue; // Still not finished
        verifiedFixture = freshFixture;

        // Update fixture in Firestore with fresh result
        await fixtureDoc.ref.set(
          { result: freshFixture.result, status: freshFixture.status },
          { merge: true }
        );
      }

      // 3. Settle predictions
      const predictions = unsettledPreds.docs.map((doc) => ({
        _id: doc.id,
        ...(doc.data() as Prediction),
      }));

      const scored = settleFixture(verifiedFixture, predictions);

      // 4. Batch write: update predictions + update user.total_points atomically
      const batch = db.batch();

      for (const result of scored) {
        // Update prediction document
        const predRef = db.doc(`predictions/${result.prediction_id}`);
        batch.update(predRef, {
          is_correct: result.is_correct,
          points_earned: result.points_earned,
          editable: false,
        });

        // Atomically increment user's total_points and correct_predictions
        const userRef = db.doc(`users/${result.user_id}`);
        batch.update(userRef, {
          total_points: FieldValue.increment(result.points_earned),
          correct_predictions: result.is_correct
            ? FieldValue.increment(1)
            : FieldValue.increment(0),
        });
      }

      // Mark fixture as settled
      batch.update(fixtureDoc.ref, { _settled_at: new Date().toISOString() });

      await batch.commit();
      settledFixtures.push(fixture.fixture_id);

      console.log(
        `[ResultSettleCron] Settled fixture ${fixture.fixture_id} (${fixture.home_team} vs ${fixture.away_team}): ${scored.length} predictions processed`
      );
    }

    return NextResponse.json({
      success: true,
      settled_fixtures: settledFixtures,
      errors,
      ran_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ResultSettleCron] Fatal error:', err);
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 });
  }
}
