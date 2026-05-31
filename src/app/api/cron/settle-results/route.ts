// GET /api/cron/settle-results
// Scheduled: */5 * * * * (every 5 minutes)
// Detects finished fixtures → runs scoring engine → updates user points atomically using Supabase RPC.
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getFixtureResult } from '@/lib/api-football';
import { Fixture } from '@/lib/types';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const settledFixtures: number[] = [];
  const errors: string[] = [];

  try {
    // 1. Find all finished fixtures that haven't been settled yet
    const { data: fixtures, error: fetchError } = await supabase
      .from('fixtures')
      .select('*')
      .in('status', ['FT', 'AET', 'PEN'])
      .is('_settled_at', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No FT fixtures to settle',
        ran_at: new Date().toISOString(),
      });
    }

    for (const fixture of fixtures) {
      try {
        // 2. Get verified result from API (or use existing database value if already has result)
        let verifiedFixture: Fixture = fixture;

        if (!fixture.result) {
          const freshFixture = await getFixtureResult(fixture.fixture_id);
          if (!freshFixture?.result) {
            console.log(`[ResultSettleCron] Fixture ${fixture.fixture_id} has no result available from API-Football yet`);
            continue; // Still not finished or API has not updated
          }
          verifiedFixture = freshFixture;

          // Update fixture with fresh result and status in database first
          const { error: updateError } = await supabase
            .from('fixtures')
            .update({
              result: freshFixture.result,
              status: freshFixture.status,
            })
            .eq('fixture_id', fixture.fixture_id);

          if (updateError) {
            throw updateError;
          }
        }

        // 3. Trigger atomic settlement using our PostgreSQL RPC function
        // This function will automatically update predictions, update user points, and set _settled_at on the fixture.
        const { error: rpcError } = await supabase
          .rpc('settle_fixture_predictions', {
            target_fixture_id: verifiedFixture.fixture_id,
            actual_result: verifiedFixture.result,
          });

        if (rpcError) {
          throw rpcError;
        }

        settledFixtures.push(fixture.fixture_id);
        console.log(
          `[ResultSettleCron] Settled fixture ${fixture.fixture_id} (${fixture.home_team} vs ${fixture.away_team}) successfully via RPC.`
        );
      } catch (err: unknown) {
        console.error(`[ResultSettleCron] Error settling fixture ${fixture.fixture_id}:`, err);
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Fixture ${fixture.fixture_id}: ${msg}`);
      }
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
