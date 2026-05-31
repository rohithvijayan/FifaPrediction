// GET /api/cron/live-poll
// Scheduled: */10 * * * * (every 10 minutes)
// Polls live World Cup matches and updates fixture status in Firestore.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getLiveFixtures } from '@/lib/api-football';
import { Fixture } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all currently live WC fixtures (not cached — realtime)
    const liveFixtures = await getLiveFixtures();

    if (liveFixtures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No live fixtures at this time',
        ran_at: new Date().toISOString(),
      });
    }

    const db = getAdminFirestore();
    const batch = db.batch();

    liveFixtures.forEach((fixture: Fixture) => {
      const ref = db.doc(`fixtures/${fixture.fixture_id}`);
      batch.set(
        ref,
        {
          status: fixture.status,
          home_score: fixture.home_score,
          away_score: fixture.away_score,
          result: fixture.result,
          _live_polled_at: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    await batch.commit();

    console.log(`[LivePollCron] Updated ${liveFixtures.length} live fixtures`);

    return NextResponse.json({
      success: true,
      updated: liveFixtures.length,
      fixtures: liveFixtures.map((f) => ({
        id: f.fixture_id,
        status: f.status,
        score: `${f.home_score ?? '-'} - ${f.away_score ?? '-'}`,
      })),
      ran_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[LivePollCron] Error:', err);
    return NextResponse.json({ error: 'Live poll failed' }, { status: 500 });
  }
}
