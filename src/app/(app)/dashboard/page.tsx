'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

import MatchCard from '@/components/MatchCard';
import { FixtureWithPrediction, PredictionResult } from '@/lib/types';

// Stats bento bar chart
function AccuracyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="bar-chart">
      {data.map((val, i) => (
        <div
          key={i}
          className={`bar-chart-bar ${i === data.length - 1 ? 'bar-chart-bar--active' : ''}`}
          style={{ height: `${Math.max((val / max) * 100, 4)}%` }}
          aria-label={`Day ${i + 1}: ${val} points`}
        />
      ))}
    </div>
  );
}

// Loading skeleton for match cards
function MatchCardSkeleton() {
  return (
    <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-xl)' }} aria-label="Loading match" />
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<FixtureWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);


  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/matches/today', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      setFixtures(data.fixtures || []);
    } catch {
      setError('Could not load today\'s matches. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Auto-refresh every 60s during match hours
  useEffect(() => {
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const handlePrediction = async (fixtureId: number, result: PredictionResult) => {
    if (!user) return;
    setSavingId(fixtureId);

    // Optimistic update
    setFixtures((prev) =>
      prev.map((f) =>
        f.fixture_id === fixtureId
          ? {
              ...f,
              user_prediction: {
                user_id: user.uid,
                fixture_id: fixtureId,
                predicted_result: result,
                editable: true,
                points_earned: 0,
                is_correct: null,
                submitted_at: new Date().toISOString(),
              },
            }
          : f
      )
    );

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fixture_id: fixtureId, predicted_result: result }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update
        await fetchMatches();
        showToast(data.error || 'Could not save prediction', 'error');
      } else {
        showToast('Prediction saved ✓', 'success');
      }
    } catch {
      await fetchMatches();
      showToast('Network error — try again', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Compute today's points from settled predictions
  const todayPoints = fixtures.reduce(
    (sum, f) => sum + (f.user_prediction?.points_earned ?? 0),
    0
  );

  const liveCount = fixtures.filter(
    (f) => ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.status)
  ).length;

  return (
    <main className="page-content fade-in-up">
      {/* Toast */}
      {toast && (
        <div className={`toast show toast--${toast.type}`} role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div
        className="page-section"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}
      >
        <div>
          <h2 className="section-title">Today&apos;s Slate</h2>
          <p className="section-subtitle">
            Lock in your expert picks before kickoff — World Cup 2026.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {liveCount > 0 && (
            <div className="live-badge">
              <div className="live-dot" />
              {liveCount} Match{liveCount > 1 ? 'es' : ''} Live
            </div>
          )}
          {todayPoints > 0 && (
            <div className="points-badge desktop-only">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>emoji_events</span>
              +{todayPoints} today
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'rgba(255,180,171,0.08)',
            border: '1px solid rgba(255,180,171,0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--color-error)',
            fontSize: 14,
          }}
          role="alert"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
          {error}
          <button
            onClick={() => { setError(''); setLoading(true); fetchMatches(); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Match cards grid */}
      <div className="match-grid stagger">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)
        ) : fixtures.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <span className="material-symbols-outlined">sports_soccer</span>
            <p style={{ fontWeight: 600 }}>No matches today</p>
            <p style={{ fontSize: 14 }}>Check back tomorrow — the World Cup schedule is loading.</p>
          </div>
        ) : (
          fixtures.map((fixture) => (
            <MatchCard
              key={fixture.fixture_id}
              fixture={fixture}
              onPrediction={handlePrediction}
              saving={savingId === fixture.fixture_id}
            />
          ))
        )}
      </div>

      {/* Stats bento */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="headline-sm" style={{ marginBottom: 'var(--space-xs)' }}>Accuracy Trend</h3>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-sm)' }}>
            Your last 7 days of predictions.
          </p>
          <AccuracyChart data={[40, 60, 80, 30, 95, 70, 50]} />
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
