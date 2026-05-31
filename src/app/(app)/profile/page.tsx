'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { User, Prediction, Fixture } from '@/lib/types';

interface PredictionWithFixture extends Prediction {
  fixture?: Fixture;
  _id: string;
}

interface DBJoinedPrediction {
  user_id: string;
  fixture_id: number;
  predicted_result: 'H' | 'D' | 'A';
  editable: boolean;
  points_earned: number;
  is_correct: boolean | null;
  submitted_at: string;
  fixture: Fixture | null;
}

const formatDate = (ts: unknown): string => {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : new Date(ts as string);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [history, setHistory] = useState<PredictionWithFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        // Fetch user profile from Supabase public.users
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('uid', user.uid)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (userProfile) {
          setProfile(userProfile as User);
        }

        // Fetch recent predictions (last 20) with joined fixture details in a single query
        const { data: predsData, error: predsError } = await supabase
          .from('predictions')
          .select('*, fixture:fixtures(*)')
          .eq('user_id', user.uid)
          .order('submitted_at', { ascending: false })
          .limit(20);

        if (predsError) {
          throw predsError;
        }

        if (predsData) {
          const mappedHistory = (predsData as unknown as DBJoinedPrediction[]).map((pred) => ({
            _id: `${pred.user_id}_${pred.fixture_id}`,
            user_id: pred.user_id,
            fixture_id: pred.fixture_id,
            predicted_result: pred.predicted_result,
            editable: pred.editable,
            points_earned: pred.points_earned,
            is_correct: pred.is_correct,
            submitted_at: pred.submitted_at,
            fixture: pred.fixture || undefined,
          }));
          setHistory(mappedHistory);
        }
      } catch (err) {
        console.error('[Profile] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const displayName = user?.displayName || 'Player';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = profile?.registered_at ? formatDate(profile.registered_at) : '';

  const wins = history.filter((p) => p.is_correct === true);
  const losses = history.filter((p) => p.is_correct === false);
  const nullified = history.filter((p) => p.is_correct === null && p.fixture?.status === 'VOID');
  const accuracyRate = history.length > 0
    ? Math.round((wins.length / history.filter((p) => p.is_correct !== null).length) * 100) || 0
    : 0;

  if (loading) {
    return (
      <main className="page-content fade-in-up">
        <div className="profile-header">
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 200, height: 40, borderRadius: 8 }} />
        </div>
        <div className="career-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="page-content fade-in-up">
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">{initials}</div>
          <div>
            <div className="profile-name">{displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 4 }}>
              <span className="profile-badge">Guru Predictor</span>
              {memberSince && (
                <span className="profile-since">· Guru since {memberSince}</span>
              )}
            </div>
          </div>
        </div>
        <div className="profile-points">
          <div className="profile-points-label">Total Accrued</div>
          <div>
            <span className="profile-points-value">
              {(profile?.total_points ?? 0).toLocaleString()}
            </span>
            <span className="profile-points-unit">PTS</span>
          </div>
        </div>
      </div>

      {/* Career stats */}
      <div className="career-stats">
        {[
          { icon: 'account_balance_wallet', label: 'Current Wallet', value: `${profile?.total_points ?? 0} PTS` },
          { icon: 'military_tech', label: 'Global Rank', value: '#—' },
          { icon: 'sports_soccer', label: 'Predictions Made', value: String(history.length) },
          { icon: 'trending_up', label: 'Accuracy Rate', value: history.length > 0 ? `${accuracyRate}%` : '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="career-stat-card">
            <div className="career-stat-icon">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
              <div className="career-stat-label">{label}</div>
              <div className="career-stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction history */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h3 className="headline-sm">Prediction History</h3>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <span
            style={{
              padding: '4px var(--space-sm)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ALL
          </span>
          <span
            style={{
              padding: '4px var(--space-sm)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--color-on-surface-variant)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            SETTLED
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined">sports_soccer</span>
          <p style={{ fontWeight: 600 }}>No predictions yet</p>
          <p style={{ fontSize: 14 }}>Head to the dashboard and make your first pick!</p>
        </div>
      ) : (
        <>
          {wins.length > 0 && (
            <div className="history-section">
              <div className="history-section-title history-section-title--win">Settled Wins</div>
              {wins.map((pred) => (
                <div key={pred._id} className="history-card">
                  <div className="history-match-icon">
                    <span className="material-symbols-outlined">sports_soccer</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="history-match-name">
                      {pred.fixture
                        ? `${pred.fixture.home_team} vs ${pred.fixture.away_team}`
                        : `Fixture #${pred.fixture_id}`}
                    </div>
                    <div className="history-match-date">
                      {pred.fixture?.match_date} · Final Score{' '}
                      {pred.fixture ? `${pred.fixture.home_score}-${pred.fixture.away_score}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Predicted: {pred.predicted_result === 'H' ? pred.fixture?.home_team?.slice(0, 3) : pred.predicted_result === 'A' ? pred.fixture?.away_team?.slice(0, 3) : 'Draw'} Win
                    </div>
                  </div>
                  <span className="history-points history-points--win">+{pred.points_earned} PTS</span>
                </div>
              ))}
            </div>
          )}

          {losses.length > 0 && (
            <div className="history-section">
              <div className="history-section-title history-section-title--loss">Losses</div>
              {losses.map((pred) => (
                <div key={pred._id} className="history-card">
                  <div className="history-match-icon" style={{ background: 'rgba(255,180,171,0.1)', color: 'var(--color-error)' }}>
                    <span className="material-symbols-outlined">sports_soccer</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="history-match-name">
                      {pred.fixture
                        ? `${pred.fixture.home_team} vs ${pred.fixture.away_team}`
                        : `Fixture #${pred.fixture_id}`}
                    </div>
                    <div className="history-match-date">
                      {pred.fixture?.match_date} · Final Score{' '}
                      {pred.fixture ? `${pred.fixture.home_score}-${pred.fixture.away_score}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Predicted: {pred.predicted_result === 'H' ? pred.fixture?.home_team?.slice(0, 3) : pred.predicted_result === 'A' ? pred.fixture?.away_team?.slice(0, 3) : 'Draw'} Win
                    </div>
                  </div>
                  <span className="history-points history-points--loss">0 PTS</span>
                </div>
              ))}
            </div>
          )}

          {nullified.length > 0 && (
            <div className="history-section">
              <div className="history-section-title history-section-title--null">Nullified</div>
              {nullified.map((pred) => (
                <div key={pred._id} className="history-card" style={{ opacity: 0.6 }}>
                  <div className="history-match-icon">
                    <span className="material-symbols-outlined">block</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="history-match-name">
                      {pred.fixture
                        ? `${pred.fixture.home_team} vs ${pred.fixture.away_team}`
                        : `Fixture #${pred.fixture_id}`}
                    </div>
                    <div className="history-match-date">Match voided</div>
                  </div>
                  <span className="history-points history-points--loss">0 PTS</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sign out */}
      <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-outline-variant)' }}>
        <button
          onClick={signOut}
          className="btn btn-ghost"
          style={{ width: '100%' }}
          id="profile-signout-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          Sign Out
        </button>
      </div>
    </main>
  );
}
