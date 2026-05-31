'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await signUp(name.trim(), email, password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Try logging in.');
      } else if (msg.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Hero panel — desktop only */}
      <div className="auth-hero">
        {/* Stadium background image */}
        <div
          className="auth-hero-bg"
          style={{
            background: 'linear-gradient(135deg, #0b1326 0%, #071a0e 40%, #0b1326 100%)',
          }}
        />
        {/* Stadium image overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/stadium-bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
          }}
        />
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content fade-in-up">
          <div className="auth-brand-title">ഗോൾ ഗുരു</div>
          <div className="auth-brand-divider" />
          <div className="auth-brand-subtitle">World Cup 2026 Prediction Hub</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Mobile-only hero text */}
          <div className="auth-mobile-brand">
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
              ഗോൾ ഗുരു
            </div>
          </div>

          <div className="auth-mobile-hero mobile-only">
            <div className="auth-mobile-hero-title">
              4 <span className="highlight">Matches.</span><br />
              4 <span className="highlight">Picks.</span><br />
              10 <span className="highlight">Points.</span><br />
              Zero fee.
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
              Predict the winners of the day and climb the global leaderboard.
            </p>
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Join the Stadium
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)' }}>
              Create your account to start making predictions.
            </p>
          </div>

          {error && (
            <div className="input-error" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name" className="input-label">Your Name</label>
            <div className="input-field">
              <span className="material-symbols-outlined">person</span>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email Address</label>
            <div className="input-field">
              <span className="material-symbols-outlined">mail</span>
              <input
                id="email"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <div className="input-field">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-on-surface-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>hourglass_empty</span>
                Creating account…
              </>
            ) : (
              <>
                START PREDICTING
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
            Already playing?{' '}
            <Link href="/login" className="auth-link">Log In</Link>
          </p>

          <div className="auth-security">
            <div className="auth-security-label">Secure Connection</div>
            <div className="auth-security-icons">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified_user</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
