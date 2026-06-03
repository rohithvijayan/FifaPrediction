'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Hero — desktop */}
      <div className="auth-hero">
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
          <div className="auth-brand-title">പന്ത്ദുനിയ</div>
          <div className="auth-brand-divider" />
          <div className="auth-brand-subtitle">World Cup 2026 Prediction Hub</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
              പന്ത്ദുനിയ
            </div>
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)' }}>
              Access your predictions and league stats.
            </p>
          </div>

          {error && (
            <div className="input-error" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email Address</label>
            <div className="input-field">
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-surface-variant)' }}>mail</span>
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" className="input-label">Password</label>
              <span
                className="auth-link"
                style={{ fontSize: 13 }}
                role="button"
                tabIndex={0}
              >
                Forgot Password?
              </span>
            </div>
            <div className="input-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>hourglass_empty</span>
                Signing in…
              </>
            ) : (
              <>
                LOG IN
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </>
            )}
          </button>

          <div className="auth-divider">OR</div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
            New player?{' '}
            <Link href="/register" className="auth-link">Create Account</Link>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-outline-variant)' }}>
            {['Privacy', 'Terms', 'Help'].map((label) => (
              <span key={label} style={{ fontSize: 13, color: 'var(--color-outline)', cursor: 'pointer' }}>{label}</span>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
