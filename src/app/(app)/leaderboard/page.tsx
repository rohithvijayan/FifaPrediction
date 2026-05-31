import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Global leaderboard — see how you rank against all Goal Guru players.',
};

export default function LeaderboardPage() {
  return (
    <main className="page-content fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Global Standings</h2>
        <div className="live-badge">
          <div className="live-dot" />
          Live polling every 30s
        </div>
      </div>
      <p className="section-subtitle">Top 20 players — your row always shown.</p>

      {/* Leaderboard table — Sprint 4 */}
      <div className="leaderboard-table stagger">
        <div className="leaderboard-header">
          <span>Rank</span>
          <span>User Name</span>
          <span>Total Points</span>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 58, borderRadius: 'var(--radius-lg)', marginBottom: 2 }}
            aria-label="Loading leaderboard row"
          />
        ))}
      </div>
    </main>
  );
}
