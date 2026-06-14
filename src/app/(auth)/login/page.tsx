'use client';

import { useState, Suspense, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

function LoginForm() {
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/predict';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [user, authLoading, router, redirect]);

  // Show a minimal spinner while auth state resolves to avoid blank flash
  if (authLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.bgGlow} />
        <div className={styles.bgGlowPink} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(148,163,184,0.2)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </main>
    );
  }

  // Don't render the form if user is already logged in (redirect is in-flight)
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(redirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      {/* Background effects */}
      <div className={styles.bgGlow} />
      <div className={styles.bgGlowPink} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Log in to view your predictions</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              className={`input-field ${error ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type="password"
              className={`input-field ${error ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              'LOG IN'
            )}
          </button>
        </form>

        {/* Register link */}
        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.switchLink}>
            Start Predicting →
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
