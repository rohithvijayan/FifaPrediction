import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Dashboard',
  description: "Today's World Cup 2026 matches — make your predictions before kickoff.",
};

export default function DashboardPage() {
  return (
    <main className="page-content fade-in-up">
      <div className="page-section">
        <h2 className="section-title">Today&apos;s Slate</h2>
        <p className="section-subtitle">
          Analyze and lock in your expert picks for today&apos;s World Cup 2026 matches.
        </p>
      </div>

      {/* Match cards — Sprint 2 will populate these from Firestore */}
      <div className="match-grid stagger">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 240, borderRadius: 'var(--radius-xl)' }}
            aria-label="Loading match card"
          />
        ))}
      </div>

      {/* Stats bento — Sprint 4 will add real data */}
      <div className="stats-grid" style={{ marginTop: 'var(--space-xl)' }}>
        <div className="stat-card">
          <h3 className="headline-sm" style={{ marginBottom: 'var(--space-xs)' }}>Accuracy Trend</h3>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-md)' }}>
            Your last 7 days of predictions.
          </p>
          <div className="bar-chart">
            {[40, 60, 80, 30, 95, 70, 50].map((h, i) => (
              <div
                key={i}
                className={`bar-chart-bar ${i === 4 ? 'bar-chart-bar--active' : ''}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="stat-card stat-card--rank">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>emoji_events</span>
          <div>
            <div className="stat-number">#—</div>
            <div className="stat-label">Global Rank</div>
          </div>
        </div>
      </div>
    </main>
  );
}
