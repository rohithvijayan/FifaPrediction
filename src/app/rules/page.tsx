'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import styles from './rules.module.css';
import layoutStyles from '../(app)/layout.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function RulesPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { href: '/predict', label: 'Predict', icon: '⚽' },
    { href: '/rules', label: 'Rules', icon: '📜' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Render rules content
  const renderRulesContent = () => (
    <div className={styles.content}>
      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>1</span>
          <h2>വേൾഡ് കപ്പ് വിജയി <span className={styles.pointsBadge}>(Max 30 Pts)</span></h2>
        </div>
        <p className={styles.ruleText}>ചാമ്പ്യന്മാരെ കൃത്യമായി പ്രവചിച്ചാൽ <strong>30 പോയിന്റ്</strong>. തെറ്റിയാൽ 0.</p>
      </section>

      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>2</span>
          <h2>റണ്ണർ-അപ്പ് <span className={styles.pointsBadge}>(Max 20 Pts)</span></h2>
        </div>
        <p className={styles.ruleText}>രണ്ടാം സ്ഥാനം കൃത്യമായി പ്രവചിച്ചാൽ <strong>20 പോയിന്റ്</strong>. തെറ്റിയാൽ 0.</p>
      </section>

      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>3</span>
          <h2>മൂന്നാം സ്ഥാനം <span className={styles.pointsBadge}>(Max 15 Pts)</span></h2>
        </div>
        <p className={styles.ruleText}>മൂന്നാം സ്ഥാനം കൃത്യമായി പ്രവചിച്ചാൽ <strong>15 പോയിന്റ്</strong>. തെറ്റിയാൽ 0.</p>
      </section>

      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>4</span>
          <h2>ഗോൾഡൻ ബൂട്ട് <span className={styles.pointsBadge}>(Max 10 Pts)</span></h2>
        </div>
        <p className={styles.ruleText}>ടോപ്പ് സ്കോററെ കൃത്യമായി പ്രവചിച്ചാൽ <strong>10 പോയിന്റ്</strong>. തെറ്റിയാൽ 0.</p>
      </section>

      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>5</span>
          <h2>ഗോൾഡൻ ഗ്ലൗവ്  <span className={styles.pointsBadge}>(Max 10 Pts)</span></h2>
        </div>
        <p className={styles.ruleText}>മികച്ച ഗോൾകീപ്പറെ കൃത്യമായി പ്രവചിച്ചാൽ <strong>10 പോയിന്റ്</strong>. തെറ്റിയാൽ 0.</p>
      </section>

      <section className={styles.ruleSection}>
        <div className={styles.ruleHeader}>
          <span className={styles.ruleNumber}>🏆</span>
          <h2>6. ഫൈനൽ മാച്ച് സ്കോർ <span className={styles.pointsBadge}>(Max 15 Pts)</span></h2>
        </div>
        <div className={styles.subRules}>
          <div className={styles.subRule}>
            <h3>15 പോയിന്റ് (Full Pts):</h3>
            <p>ഫൈനൽ കളിക്കുന്ന ടീമുകളെയും അവരുടെ കൃത്യമായ സ്കോറും അതേ ക്രമത്തിൽ പ്രവചിച്ചാൽ മാത്രം.</p>
            <div className={styles.example}>
              (ഉദാ: &apos;Brazil 2-1 France&apos; എന്ന് പ്രവചിച്ചു, കളി അങ്ങനെ തന്നെ അവസാനിച്ചാൽ).
            </div>
          </div>

          <div className={styles.subRule}>
            <h3>0 പോയിന്റ് (Zero Pts):</h3>
            <p>സ്കോറിലോ ടീമുകളുടെ ക്രമത്തിലോ ചെറിയ മാറ്റമുണ്ടായാൽ പോലും പോയിന്റ് ലഭിക്കില്ല.</p>
            <div className={styles.example}>
              (ഉദാ: ടീമുകളുടെ ഓർഡർ മാറ്റി &apos;France 1-2 Brazil&apos; എന്ന് പ്രവചിച്ചാൽ 0 പോയിന്റ്).
            </div>
          </div>
        </div>
      </section>

      <div className={styles.footerMsg}>
        <p>ഏറ്റവും കൂടുതൽ പോയിന്റ് നേടുന്നവരാണ് വിജയികൾ.<br />എല്ലാവർക്കും ആശംസകൾ! 🎉</p>
      </div>
    </div>
  );

  // If user is logged in, wrap rules page inside the app Shell (header + bottom nav)
  if (user) {
    return (
      <div className={layoutStyles.appShell}>
        {/* Top Header */}
        <header className={layoutStyles.topHeader}>
          <div className={layoutStyles.headerLeftContainer}>
            <button onClick={() => router.push('/')} className={layoutStyles.backBtn} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <Link href="/predict" className={layoutStyles.logo}>
              <Image src="/images/title.png" alt="Panthduniya Logo" width={120} height={32} className={layoutStyles.logoImage} />
            </Link>
          </div>
          <div className={layoutStyles.headerRight}>
            <span className={layoutStyles.userName}>{user.displayName}</span>
            <button onClick={signOut} className={layoutStyles.signOutBtn} title="Sign Out">
              ↗
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className={`${styles.hero} ${styles.appHero}`}>
          <div className={styles.heroCard}>
            <p className={styles.heroWorldCupText}>പന്ത്ദുനിയ</p>
            <h1 className={styles.heroTitle}>പോയിന്റ് നിയമങ്ങൾ</h1>
            <p className={styles.heroSubtitle}>FIFA WORLD CUP 2026™ PREDICTION RULES</p>
          </div>
        </div>

        {/* Main Content Area containing the rules */}
        <main className={`${layoutStyles.mainContent} anek-malayalam`}>
          {renderRulesContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className={layoutStyles.bottomNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${layoutStyles.navItem} ${item.href === '/rules' ? layoutStyles.navItemActive : ''}`}
            >
              <span className={layoutStyles.navIcon}>{item.icon}</span>
              <span className={layoutStyles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  // If guest user, render standard website layout
  return (
    <div className={`${styles.wrapper} anek-malayalam`}>
      <Navbar />

      {/* Hero Section */}
      <div className={`${styles.hero} ${styles.guestHero}`}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>പോയിന്റ് നിയമങ്ങൾ</h1>
          <p className={styles.heroSubtitle}>FIFA WORLD CUP 2026™ PREDICTION RULES</p>
        </div>
      </div>

      <main className={styles.main}>
        {renderRulesContent()}
      </main>
    </div>
  );
}
