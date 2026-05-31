'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Fixture } from '@/lib/types';

export default function AdminPage() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: dbFixtures, error: dbError } = await supabase
          .from('fixtures')
          .select('*')
          .eq('match_date', today);

        if (dbError) {
          throw dbError;
        }

        const fixtureList = (dbFixtures || []) as Fixture[];
        fixtureList.sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());
        setFixtures(fixtureList);
      } catch (err) {
        console.error('[Admin] Error fetching fixtures:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, [user]);

  const handleSettle = async (fixtureId: number) => {
    if (!user || settling) return;
    setSettling(fixtureId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fixture_id: fixtureId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          [fixtureId]: `✅ Settled: ${data.correct} correct, ${data.wrong} wrong (result: ${data.result})`,
        }));
      } else {
        setResults((prev) => ({ ...prev, [fixtureId]: `❌ Error: ${data.error}` }));
      }
    } catch {
      setResults((prev) => ({ ...prev, [fixtureId]: '❌ Network error' }));
    } finally {
      setSettling(null);
    }
  };

  return (
    <main className="page-content fade-in-up">
      <div className="admin-panel">
        <div className="admin-header">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-error)', fontSize: 28 }}>
            admin_panel_settings
          </span>
          <h1 className="admin-title">Admin Panel 🔒</h1>
        </div>

        <div className="admin-warning">
          ⚠️ Admin-only area. Settling a match will update all user points. Use only after full-time.
        </div>

        <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 15, color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Today&apos;s Fixtures
        </h3>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-sm)' }} />
          ))
        ) : fixtures.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">calendar_today</span>
            <p>No fixtures found for today.</p>
          </div>
        ) : (
          fixtures.map((fixture) => (
            <div key={fixture.fixture_id} className="admin-fixture-row">
              <div className="admin-fixture-info">
                <div>{fixture.home_team} vs {fixture.away_team}</div>
                <div className="admin-fixture-id">
                  ID: {fixture.fixture_id} · {fixture.kickoff_ist} · Status: {fixture.status}
                  {fixture.result ? ` · Result: ${fixture.result}` : ''}
                </div>
                {results[fixture.fixture_id] && (
                  <div style={{ marginTop: 4, fontSize: 13, color: results[fixture.fixture_id].startsWith('✅') ? 'var(--color-primary)' : 'var(--color-error)' }}>
                    {results[fixture.fixture_id]}
                  </div>
                )}
              </div>
              <button
                className="btn-settle"
                onClick={() => handleSettle(fixture.fixture_id)}
                disabled={settling === fixture.fixture_id}
                id={`admin-settle-${fixture.fixture_id}`}
                aria-label={`Settle result for ${fixture.home_team} vs ${fixture.away_team}`}
              >
                {settling === fixture.fixture_id ? 'Settling…' : 'Settle Result'}
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
