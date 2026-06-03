'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const pageTitles: Record<string, string> = {
  '/dashboard':   'Daily Dashboard',
  '/leaderboard': 'Leaderboard',
  '/profile':     'My Profile',
  '/admin':       'Admin Panel',
};

export default function TopHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? 'Panth Duniya';

  const displayName = user?.displayName || 'P';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="app-header" role="banner">
      <div className="app-header-left">
        {/* Mobile brand */}
        <span className="mobile-brand mobile-only">പന്ത്ദുനിയ</span>
        {/* Desktop title */}
        <h1 className="app-header-title desktop-only">{title}</h1>
      </div>

      <div className="app-header-right">
        {/* Points badge — mobile */}
        <div className="points-badge mobile-only" aria-label="Your total points">
          <span className="material-symbols-outlined">emoji_events</span>
          <span>Total: 0 pts</span>
        </div>

        {/* Notification button */}
        <button className="header-icon-btn" aria-label="Notifications" id="header-notifications-btn">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notification-dot" aria-hidden="true" />
        </button>

        {/* User avatar — desktop */}
        <div
          className="desktop-only"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--color-primary-container)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-headline)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-on-primary-container)',
          }}
          aria-label={`User: ${displayName}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
