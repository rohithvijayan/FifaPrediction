// POST /api/admin/settle
// Admin-only: manually trigger result settlement for a specific fixture_id.
// Protected by is_admin flag in the public.users database table.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFixtureResult } from '@/lib/api-football';
import { Fixture } from '@/lib/types';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // 1. Verify user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch user profile to verify is_admin flag
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('uid', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // 3. Parse body
    let body: { fixture_id: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { fixture_id } = body;
    if (!fixture_id) {
      return NextResponse.json({ error: 'fixture_id required' }, { status: 400 });
    }

    // 4. Fetch fixture from database
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('fixture_id', fixture_id)
      .single();

    if (fixtureError || !fixture) {
      return NextResponse.json({ error: 'Fixture not found in database' }, { status: 404 });
    }

    let verifiedFixture: Fixture = fixture;

    // 5. If result is null, fetch from API
    if (!fixture.result) {
      const freshFixture = await getFixtureResult(fixture_id);
      if (!freshFixture?.result) {
        return NextResponse.json({
          error: 'Match has not finished yet — no result available from API-Football',
        }, { status: 422 });
      }
      verifiedFixture = freshFixture;

      // Update fixture with result in DB
      await supabase
        .from('fixtures')
        .update({ result: freshFixture.result, status: freshFixture.status })
        .eq('fixture_id', fixture_id);
    }

    // 6. Trigger atomic settlement using our high-performance RPC function
    const { error: rpcError } = await supabase
      .rpc('settle_fixture_predictions', {
        target_fixture_id: fixture_id,
        actual_result: verifiedFixture.result,
      });

    if (rpcError) {
      throw rpcError;
    }

    // Update manually settled flag
    await supabase
      .from('fixtures')
      .update({ _manually_settled_at: new Date().toISOString() } as Record<string, string>)
      .eq('fixture_id', fixture_id);

    return NextResponse.json({
      success: true,
      fixture_id,
      result: verifiedFixture.result,
      message: 'Fixture predictions settled successfully.',
    });
  } catch (err) {
    console.error('[/api/admin/settle] Error:', err);
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 });
  }
}
