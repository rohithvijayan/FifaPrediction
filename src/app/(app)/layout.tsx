'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPredictPage = pathname === '/predict';

  useEffect(() => {
    if (!loading && !user && !isPredictPage) {
      router.push('/login');
    }
  }, [user, loading, router, isPredictPage]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user && !isPredictPage) return null;

  const navItems = [
    { href: '/predict', label: 'Predict', icon: '⚽' },
    { href: '/results', label: 'Standings', icon: '📊' },
    { href: '/rules', label: 'Rules', icon: '📜' },
    ...(user ? [{ href: '/profile', label: 'Profile', icon: '👤' }] : []),
  ];

  return (
    <div className={styles.appShell}>
      {/* Top Header */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeftContainer}>
          {pathname !== '/' && (
            <button onClick={() => router.push('/')} className={styles.backBtn} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <Link href="/predict" className={styles.logo}>
            <Image src="/images/title.png" alt="Panthduniya Logo" width={120} height={32} className={styles.logoImage} />
          </Link>
        </div>
        <div className={styles.headerRight}>
          {user && (
            <>
              <span className={styles.userName}>{user.displayName}</span>
              <button onClick={signOut} className={styles.signOutBtn} title="Sign Out">
                ↗
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
