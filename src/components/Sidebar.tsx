'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard',    label: 'Daily Predictions', icon: 'calendar_today' },
  { href: '/leaderboard',  label: 'Live Leaderboard',  icon: 'leaderboard' },
  { href: '/profile',      label: 'My Profile',        icon: 'person' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName = user?.displayName || 'Player';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">പന്ത്ദുനിയ</div>
        <div className="sidebar-brand-points">World Cup 2026</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" role="navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/dashboard">
          <button className="sidebar-cta" id="sidebar-predict-btn">
            Make Predictions
          </button>
        </Link>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-label={`Avatar for ${displayName}`}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div className="sidebar-user-tag">Guru Predictor</div>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
