// GET /api/leaderboard
// Returns top 20 users ordered by total_points DESC, plus the calling user's rank.
// Tie-breaking: (1) most correct_predictions, (2) earliest registered_at
// Uses Supabase SSR session cookie for authentication.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardEntry } from '@/lib/types';

export async function GET() {
  const supabase = createClient();

  // 1. Verify user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = user.id;

  try {
    // 2. Fetch top 20 users
    const { data: topUsers, error: topError } = await supabase
      .from('users')
      .select('uid, name, total_points, correct_predictions, registered_at')
      .order('total_points', { ascending: false })
      .order('correct_predictions', { ascending: false })
      .order('registered_at', { ascending: true })
      .limit(20);

    if (topError) {
      throw topError;
    }

    const top20: LeaderboardEntry[] = (topUsers || []).map((doc, index) => ({
      uid: doc.uid,
      name: doc.name,
      total_points: doc.total_points ?? 0,
      correct_predictions: doc.correct_predictions ?? 0,
      rank: index + 1,
    }));

    // 3. Find calling user's rank
    let ownEntry = top20.find((u) => u.uid === uid);

    if (!ownEntry) {
      // User is outside the top 20, query their profile and exact rank
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('uid, name, total_points, correct_predictions, registered_at')
        .eq('uid', uid)
        .single();

      if (userError) {
        throw userError;
      }

      if (currentUser) {
        // Count how many users rank higher based on tie-breaking logic
        
        // A. Users with more points
        const { count: pointsCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt('total_points', currentUser.total_points);

        // B. Users with equal points but more correct predictions
        const { count: correctCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('total_points', currentUser.total_points)
          .gt('correct_predictions', currentUser.correct_predictions);

        // C. Users with equal points & correct predictions but earlier registration
        const { count: tiesCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('total_points', currentUser.total_points)
          .eq('correct_predictions', currentUser.correct_predictions)
          .lt('registered_at', currentUser.registered_at);

        const rank = (pointsCount || 0) + (correctCount || 0) + (tiesCount || 0) + 1;

        ownEntry = {
          uid,
          name: currentUser.name,
          total_points: currentUser.total_points ?? 0,
          correct_predictions: currentUser.correct_predictions ?? 0,
          rank,
        };
      }
    }

    // Get total player count
    const { count: totalPlayers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      top20,
      own: ownEntry ?? null,
      total_players: totalPlayers || top20.length,
    });
  } catch (err) {
    console.error('[/api/leaderboard] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
