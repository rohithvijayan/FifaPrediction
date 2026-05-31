'use client';

import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  top20: LeaderboardEntry[];
  ownEntry: LeaderboardEntry | null;
  currentUid: string;
}

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? 'rank-badge rank-badge--1' :
    rank === 2 ? 'rank-badge rank-badge--2' :
    rank === 3 ? 'rank-badge rank-badge--3' :
    'rank-badge rank-badge--default';
  return <div className={cls}>{rank}</div>;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return <div className="user-avatar">{initials}</div>;
}

export default function LeaderboardTable({ top20, ownEntry, currentUid }: LeaderboardTableProps) {
  // Check if user is already in top 20
  const ownInTop20 = top20.some((u) => u.uid === currentUid);

  return (
    <div className="leaderboard-table" role="table" aria-label="Global leaderboard">
      {/* Header */}
      <div className="leaderboard-header" role="row">
        <span role="columnheader">Rank</span>
        <span role="columnheader">User Name</span>
        <span role="columnheader" style={{ textAlign: 'right' }}>Total Points</span>
      </div>

      {/* Top 20 rows */}
      <div className="stagger" role="rowgroup">
        {top20.map((entry) => {
          const isOwn = entry.uid === currentUid;
          return (
            <div
              key={entry.uid}
              className={`leaderboard-row ${isOwn ? 'leaderboard-row--own' : ''}`}
              role="row"
              aria-label={`Rank ${entry.rank}: ${entry.name}, ${entry.total_points} points${isOwn ? ' (you)' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center' }} role="cell">
                <RankBadge rank={entry.rank} />
              </div>

              <div className="leaderboard-user" role="cell">
                <UserAvatar name={entry.name} />
                <span style={{ fontWeight: isOwn ? 700 : 500, fontSize: 15 }}>
                  {isOwn ? `${entry.name} (You)` : entry.name}
                </span>
              </div>

              <div style={{ textAlign: 'right' }} role="cell">
                <span className="leaderboard-points">{entry.total_points.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Own row — pinned at bottom if outside top 20 */}
      {!ownInTop20 && ownEntry && (
        <>
          <div style={{ padding: '8px var(--space-md)', textAlign: 'center', color: 'var(--color-outline)', fontSize: 12 }}>
            · · ·
          </div>
          <div
            className="leaderboard-row leaderboard-row--own"
            role="row"
            aria-label={`Your rank: ${ownEntry.rank}, ${ownEntry.total_points} points`}
          >
            <div style={{ display: 'flex', alignItems: 'center' }} role="cell">
              <div className="rank-badge rank-badge--default" style={{ background: 'rgba(78,222,163,0.15)', color: 'var(--color-primary)' }}>
                #{ownEntry.rank}
              </div>
            </div>
            <div className="leaderboard-user" role="cell">
              <UserAvatar name={ownEntry.name} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{ownEntry.name} (You)</span>
            </div>
            <div style={{ textAlign: 'right' }} role="cell">
              <span className="leaderboard-points">{ownEntry.total_points} pts</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
