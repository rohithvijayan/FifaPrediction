// GET /api/matches/today
// Returns today's fixtures (IST date) with the calling user's prediction state.
// Uses Supabase SSR session cookie for authentication.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFixturesByDate, getISTDate } from '@/lib/api-football';
import { Fixture, Prediction, FixtureWithPrediction } from '@/lib/types';
interface DBJoinedFixture extends Fixture {
  predictions: Prediction[];
}

export async function GET() {
  const supabase = createClient();
  
  // 1. Verify user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get today's IST date
  const today = getISTDate(new Date().toISOString());

  try {
    // 3. Query fixtures and join predictions for the current user
    const { data: dbFixtures, error: dbError } = await supabase
      .from('fixtures')
      .select('*, predictions(*)')
      .eq('match_date', today)
      .order('kickoff_utc', { ascending: true });

    if (dbError) {
      throw dbError;
    }

    let fixturesWithPredictions: FixtureWithPrediction[] = [];

    if (dbFixtures && dbFixtures.length > 0) {
      // Map predictions array from relation join to user_prediction object
      fixturesWithPredictions = (dbFixtures as unknown as DBJoinedFixture[]).map((f) => {
        const { predictions, ...fixtureData } = f;
        return {
          ...fixtureData,
          user_prediction: predictions && predictions.length > 0 ? predictions[0] : undefined,
        };
      });
    } else {
      // 4. Fallback: fetch from API-Football (via cache)
      const fixtures = await getFixturesByDate(today);
      fixturesWithPredictions = fixtures.map((fixture: Fixture) => ({
        ...fixture,
        user_prediction: undefined,
      }));
    }

    return NextResponse.json({
      date: today,
      fixtures: fixturesWithPredictions,
    });
  } catch (err) {
    console.error('[/api/matches/today] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
