'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard',   label: 'Predict',      icon: 'sports_soccer' },
  { href: '/leaderboard', label: 'Leaderboard',  icon: 'leaderboard' },
  { href: '/profile',     label: 'Profile',      icon: 'person' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav mobile-only" role="navigation" aria-label="Bottom navigation">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            id={`bottom-nav-${item.label.toLowerCase()}`}
          >
            <div className="bottom-nav-icon-wrap">
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 22 }}>
                {item.icon}
              </span>
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
