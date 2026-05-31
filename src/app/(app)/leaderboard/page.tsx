'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LeaderboardTable from '@/components/LeaderboardTable';
import { LeaderboardEntry } from '@/lib/types';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface LeaderboardData {
  top20: LeaderboardEntry[];
  own: LeaderboardEntry | null;
  total_players: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Could not load leaderboard. Retrying…');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // 30-second polling
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <main className="page-content fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Global Standings</h2>
        <div className="live-badge" aria-label="Live polling every 30 seconds">
          <div className="live-dot" />
          Live polling every 30s
        </div>
      </div>

      {lastUpdated && (
        <p className="section-subtitle" style={{ marginBottom: 'var(--space-lg)' }}>
          Last updated at {formatLastUpdated()}
        </p>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
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
          {error}
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="stagger">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 58, borderRadius: 'var(--radius-lg)', marginBottom: 2 }} />
          ))}
        </div>
      ) : data ? (
        <LeaderboardTable
          top20={data.top20}
          ownEntry={data.own}
          currentUid={user?.uid ?? ''}
        />
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined">leaderboard</span>
          <p style={{ fontWeight: 600 }}>No players yet</p>
          <p style={{ fontSize: 14 }}>Be the first to make predictions!</p>
        </div>
      )}
    </main>
  );
}
