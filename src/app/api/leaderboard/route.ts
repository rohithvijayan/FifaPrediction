// GET /api/leaderboard
// Returns top 20 users ordered by total_points DESC, plus the calling user's rank.
// Tie-breaking: (1) most correct_predictions, (2) earliest registered_at
// Requires Firebase ID token.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { LeaderboardEntry } from '@/lib/types';

export async function GET(request: NextRequest) {
  // 1. Verify Firebase token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const db = getAdminFirestore();

  try {
    // 2. Query top 50 users (we need extra to find user's rank if outside top 20)
    const usersSnap = await db
      .collection('users')
      .orderBy('total_points', 'desc')
      .orderBy('correct_predictions', 'desc')
      .orderBy('registered_at', 'asc')
      .limit(50)
      .get();

    const allUsers = usersSnap.docs.map((doc, index) => ({
      uid: doc.id,
      name: doc.data().name,
      total_points: doc.data().total_points ?? 0,
      correct_predictions: doc.data().correct_predictions ?? 0,
      rank: index + 1,
    }));

    // 3. Top 20
    const top20: LeaderboardEntry[] = allUsers.slice(0, 20);

    // 4. Find calling user's rank & today's points
    let ownEntry = allUsers.find((u) => u.uid === uid);

    // If user is outside top 50, fetch their doc separately
    if (!ownEntry) {
      const userDoc = await db.doc(`users/${uid}`).get();
      if (userDoc.exists) {
        // Count users with more points (approximate rank)
        const aboveSnap = await db
          .collection('users')
          .where('total_points', '>', userDoc.data()!.total_points)
          .count()
          .get();
        const rank = aboveSnap.data().count + 1;

        ownEntry = {
          uid,
          name: userDoc.data()!.name,
          total_points: userDoc.data()!.total_points ?? 0,
          correct_predictions: userDoc.data()!.correct_predictions ?? 0,
          rank,
        };
      }
    }

    return NextResponse.json({
      top20,
      own: ownEntry ?? null,
      total_players: allUsers.length, // approximate
    });
  } catch (err) {
    console.error('[/api/leaderboard] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
