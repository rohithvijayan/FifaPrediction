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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/predict', label: 'Predict', icon: '⚽' },
    { href: '/leaderboard', label: 'Ranks', icon: '🏆' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className={styles.appShell}>
      {/* Top Header */}
      <header className={styles.topHeader}>
        <Link href="/predict" className={styles.logo}>
          <Image src="/images/title.png" alt="Panthduniya Logo" width={120} height={32} className={styles.logoImage} />
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user.displayName}</span>
          <button onClick={signOut} className={styles.signOutBtn} title="Sign Out">
            ↗
          </button>
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
