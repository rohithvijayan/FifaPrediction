import Link from 'next/link';
import Image from 'next/image';
import Navbar from './components/Navbar';
import styles from './page.module.css';
import { createClient } from '@/lib/supabase/server';

interface TeamRegistration {
  team_code: string;
  team_name: string;
  flag_emoji: string;
  registration_count: number;
}

export default async function LandingPage() {
  const supabase = createClient();
  const { data: topTeams } = await supabase
    .from('team_registration_counts')
    .select('*')
    .order('registration_count', { ascending: false })
    .limit(3);

  const displayTeams = (topTeams || []) as unknown as TeamRegistration[];
  return (
    <div className={styles.wrapper}>
      <Navbar />

      {/* Hero Section */}
      <main className={styles.main}>
        <div className={styles.heroContainer}>
          {/* Background Image Layer */}
          <div className={styles.heroImageWrapper}>
            <picture>
              <source media="(min-width: 768px)" srcSet="/images/desktopHERO.webp" />
              <img
                alt="Football Stars"
                className={styles.heroImage}
                src="/images/mobile1.jpeg"
              />
            </picture>
            <div className={styles.heroGradientOverlay}></div>
            {/* Overlay Content */}
            <div className={styles.heroOverlayContent}>
              <Image src="/images/title.png" alt="പന്ത് ദുനിയ" width={800} height={300} className={styles.heroLogo} priority />
              <p className={styles.subTitle}>A Yuvadhara Online Initiative</p>
              <Link href="/predict" className={styles.startBtn} style={{ marginTop: '1.5rem', maxWidth: '320px' }}>
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fillRule="evenodd"></path>
                </svg>
                START PREDICTING
              </Link>
            </div>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {/* Hub Subtitle */}
            <div className={styles.hubHeader}>
              <p className={styles.worldCupText}>World Cup 2026</p>
              <div className={styles.predictionHub}>
                <span className={styles.line}></span>
                <h2>Prediction Hub</h2>
                <span className={styles.line}></span>
              </div>
            </div>

            {/* Features Grid */}
            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <div className={`${styles.featureIcon} ${styles.iconPrimary}`}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <p>6 QUESTIONS<br />100 POINTS</p>
              </div>

              <div className={styles.featureItem}>
                <div className={`${styles.featureIcon} ${styles.iconTeal}`}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <p>PARTIAL<br />CREDIT</p>
              </div>

              <div className={styles.featureItem}>
                <div className={`${styles.featureIcon} ${styles.iconYellow}`}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <p>CLIMB THE<br />LEADERBOARD</p>
              </div>
            </div>

            {/* Top Registered Teams Leaderboard */}
            <div className={styles.topTeamsSection}>
              <div className={styles.topTeamsHeader}>
                <span className={styles.hotBadge}>🔥 TRENDING FANS</span>
                <h3>Popular Teams</h3>
                <p>Teams with the highest registrations on Goal Guru</p>
              </div>

              <div className={styles.teamsGrid}>
                {displayTeams.length > 0 ? (
                  displayTeams.map((team: TeamRegistration, index: number) => {
                    const rankMedals = ['🥇', '🥈', '🥉'];
                    const rankColors = [styles.rankFirst, styles.rankSecond, styles.rankThird];
                    return (
                      <div key={team.team_code} className={`${styles.teamRankCard} ${rankColors[index]}`}>
                        <div className={styles.rankBadge}>
                          <span className={styles.rankMedal}>{rankMedals[index]}</span>
                          <span className={styles.rankNumber}>#{index + 1}</span>
                        </div>
                        <div className={styles.teamFlagWrapper}>
                          <span className={styles.teamFlag}>{team.flag_emoji}</span>
                        </div>
                        <div className={styles.teamInfo}>
                          <h4>{team.team_name}</h4>
                          <p><strong>{team.registration_count}</strong> {team.registration_count === 1 ? 'Fan' : 'Fans'} Joined</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyTeams}>
                    <span className={styles.emptyIcon}>⚽</span>
                    <p>No team registrations yet. Support your favourite team first by registering!</p>
                  </div>
                )}
              </div>
            </div>

            <p className={styles.description}>
              Predict match winners, earn points<br />and compete with football fans across the globe!
            </p>

            <div className={styles.yuvadharaSection}>
              <span className={styles.yuvadharaLabel}>An Initiative By</span>
              <Image
                src="/images/yuvadharaLogo.png"
                alt="Yuvadhara Logo"
                width={272}
                height={85}
                className={styles.yuvadharaLogo}
              />
            </div>

            <div className={styles.secondaryInfo}>
              <p className={styles.infoTitle}>FIFA World Cup 2026™</p>
              <p className={styles.infoSubtitle}>June 11 - July 19 • Zero Fee</p>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.initiativeText}>
          <a href="https://www.dyfikerala.com/" target="_blank" rel="noopener noreferrer">
            Created by DYFI PROFESSIONAL SUBCOMMITTEE
          </a>
        </div>
        <div className={styles.socialLinks}>
          <a href="https://www.facebook.com/share/18D1yeewhj/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="https://www.instagram.com/yuvadharaonline?igsh=bGJhaTNzMW0wdmxt" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
