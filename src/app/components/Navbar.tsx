'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const showBackButton = pathname !== '/';

  return (
    <nav className={styles.nav}>
      <div className={styles.brandContainer}>
        {showBackButton && (
          <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        )}
        <Link href="/" className={styles.brandText}>
          <Image src="/images/title.png" alt="Panthduniya Logo" width={150} height={40} className={styles.navLogo} />
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link href="/fixtures" className="anek-malayalam">മത്സരങ്ങൾ</Link>
        <Link href="/results" className="anek-malayalam">പോയിന്റ് നില</Link>
        <Link href="/rules" className="anek-malayalam">നിയമങ്ങൾ</Link>
      </div>
      <div className={styles.navRight}>
        <Link href="/predict" className={`${styles.predictBtn} anek-malayalam`}>പ്രവചിക്കു</Link>
      </div>
    </nav>
  );
}
