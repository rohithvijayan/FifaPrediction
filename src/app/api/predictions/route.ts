// POST /api/predictions
// Submit or update a prediction for a fixture.
// Server-side kickoff lock: rejected if current time >= fixture.kickoff_utc.
// Uses Supabase SSR session cookie for authentication.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictionResult, Fixture } from '@/lib/types';

import { getLiveFixture } from '@/lib/api-football';

const VALID_RESULTS: PredictionResult[] = ['H', 'D', 'A'];

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // 1. Verify user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  try {
    // 3. Fetch fixture to check kickoff lock
    let fixture: Fixture | null = null;
    const { data: dbFixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('fixture_id', fixture_id)
      .maybeSingle();

    if (fixtureError) {
      throw fixtureError;
    }

    if (!dbFixture) {
      // Self-healing: if the fixture has not been seeded in the DB yet,
      // fetch it dynamically from API-Football / Mock generator and insert it
      try {
        const freshFixture = await getLiveFixture(fixture_id);
        if (!freshFixture) {
          return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
        }

        const { error: insertError } = await supabase
          .from('fixtures')
          .insert({
            fixture_id: freshFixture.fixture_id,
            match_date: freshFixture.match_date,
            kickoff_utc: freshFixture.kickoff_utc,
            kickoff_ist: freshFixture.kickoff_ist,
            home_team: freshFixture.home_team,
            away_team: freshFixture.away_team,
            home_team_logo: freshFixture.home_team_logo || null,
            away_team_logo: freshFixture.away_team_logo || null,
            home_score: freshFixture.home_score,
            away_score: freshFixture.away_score,
            status: freshFixture.status,
            result: freshFixture.result,
            _seeded_at: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        fixture = freshFixture;
      } catch (err) {
        console.error('[/api/predictions] Failed to dynamically seed fixture:', err);
        return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
      }
    } else {
      fixture = dbFixture;
    }

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    const kickoffUtc = new Date(fixture.kickoff_utc);
    const now = new Date();

    // SERVER-SIDE LOCK: reject if kickoff has passed
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

    // 4. Write prediction to Supabase predictions table (upsert on composite key user_id + fixture_id)
    const { error: predictionError } = await supabase
      .from('predictions')
      .upsert({
        user_id: user.id,
        fixture_id,
        predicted_result,
        editable: true,
        points_earned: 0,
        is_correct: null,
        submitted_at: new Date().toISOString(),
      });

    if (predictionError) {
      throw predictionError;
    }

    return NextResponse.json({
      success: true,
      prediction: {
        fixture_id,
        predicted_result,
        editable: true,
      },
    });
  } catch (err) {
    console.error('[/api/predictions] Supabase write error:', err);
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
  }
}
