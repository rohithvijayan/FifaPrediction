'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import TopHeader from '@/components/TopHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'var(--color-primary)', animation: 'pulse 1.5s ease-in-out infinite' }}
          >
            sports_soccer
          </span>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopHeader />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
