// GET /api/cron/seed-fixtures
// Scheduled: 0 1 * * * (01:00 UTC = 06:30 IST)
// Seeds today's and tomorrow's fixtures from API-Football into Supabase fixtures table.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
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

  const supabase = createAdminClient();
  const results: Record<string, { seeded: number; date: string }> = {};

  for (const date of [today, tomorrow]) {
    try {
      const fixtures = await getFixturesByDate(date);

      if (fixtures.length === 0) {
        results[date] = { seeded: 0, date };
        continue;
      }

      // Upsert into Supabase fixtures table
      const payload = fixtures.map((fixture: Fixture) => ({
        fixture_id: fixture.fixture_id,
        match_date: fixture.match_date,
        kickoff_utc: fixture.kickoff_utc,
        kickoff_ist: fixture.kickoff_ist,
        home_team: fixture.home_team,
        away_team: fixture.away_team,
        home_team_logo: fixture.home_team_logo || null,
        away_team_logo: fixture.away_team_logo || null,
        home_score: fixture.home_score,
        away_score: fixture.away_score,
        status: fixture.status,
        result: fixture.result,
        _seeded_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('fixtures')
        .upsert(payload, { onConflict: 'fixture_id' });

      if (error) {
        throw error;
      }

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
