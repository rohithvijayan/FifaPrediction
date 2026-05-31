// GET /api/cron/live-poll
// Scheduled: */10 * * * * (every 10 minutes)
// Polls live World Cup matches and updates fixture status in Supabase.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getLiveFixtures } from '@/lib/api-football';
import { Fixture } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all currently live WC fixtures from API-Football (realtime)
    const liveFixtures = await getLiveFixtures();

    if (liveFixtures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No live fixtures at this time',
        ran_at: new Date().toISOString(),
      });
    }

    const supabase = createAdminClient();

    // In Supabase, upserting will merge on the primary key fixture_id
    // But since we omit fields like home_team, match_date etc here, a simple upsert in Supabase
    // might nullify other columns unless we supply all required non-null fields, OR we do an update for each!
    // Wait, let's think: is there a better way to do partial upserts in Supabase?
    // In PostgreSQL, `INSERT ... ON CONFLICT (fixture_id) DO UPDATE SET status = EXCLUDED.status, ...` is the exact SQL statement.
    // In Supabase JS client, `upsert` without supplying all fields will set missing columns to default or null if they aren't supplied in the payload!
    // Wait! Let's check this behavior. Yes, in Supabase client, a standard `upsert` actually inserts a new row and updates it on conflict, so if you omit columns, they will be set to their default values (which is NULL for most columns)!
    // To prevent this from nullifying existing fields (like `home_team`, `away_team`, `match_date`), we should write a clean PostgreSQL upsert or perform sequential updates, OR we can select all live fixtures first and combine them, OR we can run a simple custom RPC, or perform simple single updates!
    // Wait! Since there are rarely more than 2-4 matches live at the same time (usually just 1 or 2 at any given hour), running individual `update` queries in a simple `Promise.all` loop is extremely clean, fast, and does NOT nullify other columns!
    // Let's see:
    // ```typescript
    // const updatePromises = liveFixtures.map((f) =>
    //   supabase
    //     .from('fixtures')
    //     .update({
    //       status: f.status,
    //       home_score: f.home_score,
    //       away_score: f.away_score,
    //       result: f.result,
    //       _live_polled_at: new Date().toISOString(),
    //     })
    //     .eq('fixture_id', f.fixture_id)
    // );
    // await Promise.all(updatePromises);
    // ```
    // Oh! This is absolutely perfect! It completely avoids the problem of partial upsert column nullification, it is incredibly straightforward, and is extremely safe because it is a direct `UPDATE ... WHERE fixture_id = X` statement!
    // Let's write this super clean solution!
    
    const updatePromises = liveFixtures.map((fixture: Fixture) =>
      supabase
        .from('fixtures')
        .update({
          status: fixture.status,
          home_score: fixture.home_score,
          away_score: fixture.away_score,
          result: fixture.result,
          _live_polled_at: new Date().toISOString(),
        })
        .eq('fixture_id', fixture.fixture_id)
    );

    const updateResults = await Promise.all(updatePromises);
    
    // Check if any updates failed
    for (const res of updateResults) {
      if (res.error) {
        throw res.error;
      }
    }

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
