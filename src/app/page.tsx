'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="landing-page">
        <div className="skeleton" style={{ width: 200, height: 64, borderRadius: 8 }} />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="landing-page">
      <div className="fade-in-up">
        <div className="landing-logo">ഗോൾ ഗുരു</div>
        <div className="landing-subtitle">World Cup 2026 Prediction Hub</div>
        <p className="landing-tagline">
          <strong>4 matches.</strong> 4 picks. 10 points each.{' '}
          Predict the winners and climb the global leaderboard.
        </p>
        <div className="landing-ctas">
          <Link href="/register">
            <button className="btn btn-primary btn-full" id="landing-start-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sports_soccer</span>
              Start Predicting
            </button>
          </Link>
          <Link href="/login">
            <button className="btn btn-ghost btn-full" id="landing-login-btn">
              Log In
            </button>
          </Link>
        </div>
        <div className="landing-footer">
          FIFA World Cup 2026 · June 11 – July 19 · Zero fee
        </div>
      </div>
    </main>
  );
}
