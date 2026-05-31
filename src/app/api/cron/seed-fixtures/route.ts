// GET /api/cron/seed-fixtures
// Scheduled: 0 1 * * * (01:00 UTC = 06:30 IST)
// Seeds today's and tomorrow's fixtures from API-Football into Firestore.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getFixturesByDate, getISTDate } from '@/lib/api-football';
import { Fixture } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = getISTDate(now.toISOString());

  // Tomorrow in IST
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = getISTDate(tomorrowDate.toISOString());

  const db = getAdminFirestore();
  const results: Record<string, { seeded: number; date: string }> = {};

  for (const date of [today, tomorrow]) {
    try {
      const fixtures = await getFixturesByDate(date);

      if (fixtures.length === 0) {
        results[date] = { seeded: 0, date };
        continue;
      }

      // Batch write to Firestore
      const batch = db.batch();
      fixtures.forEach((fixture: Fixture) => {
        const ref = db.doc(`fixtures/${fixture.fixture_id}`);
        batch.set(ref, {
          ...fixture,
          // Preserve existing result/status if already settled
          _seeded_at: new Date().toISOString(),
        }, { merge: true });
      });

      await batch.commit();
      results[date] = { seeded: fixtures.length, date };

      console.log(`[FixtureSeedCron] Seeded ${fixtures.length} fixtures for ${date}`);
    } catch (err) {
      console.error(`[FixtureSeedCron] Error seeding ${date}:`, err);
      results[date] = { seeded: -1, date };
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Fixture seed complete',
    results,
    ran_at: new Date().toISOString(),
  });
}
