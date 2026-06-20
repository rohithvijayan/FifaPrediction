'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import styles from './fixtures.module.css';
import fixturesData from '../../../fixtures.json';

// ── Country codes map for all 48 WC 2026 teams ──────────────────────────────────
const TEAM_COUNTRY_CODES: Record<string, string> = {
  'Mexico': 'MX',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'Czechia': 'CZ',
  'Canada': 'CA',
  'Bosnia and Herzegovina': 'BA',
  'USA': 'US',
  'Paraguay': 'PY',
  'Qatar': 'QA',
  'Switzerland': 'CH',
  'Brazil': 'BR',
  'Morocco': 'MA',
  'Haiti': 'HT',
  'Scotland': 'GB-SCT',
  'Australia': 'AU',
  'Turkey': 'TR',
  'Germany': 'DE',
  'Curaçao': 'CW',
  'Netherlands': 'NL',
  'Japan': 'JP',
  'Ivory Coast': 'CI',
  'Ecuador': 'EC',
  'Sweden': 'SE',
  'Tunisia': 'TN',
  'Spain': 'ES',
  'Cape Verde': 'CV',
  'Belgium': 'BE',
  'Egypt': 'EG',
  'Saudi Arabia': 'SA',
  'Uruguay': 'UY',
  'Iran': 'IR',
  'New Zealand': 'NZ',
  'France': 'FR',
  'Senegal': 'SN',
  'Iraq': 'IQ',
  'Norway': 'NO',
  'Argentina': 'AR',
  'Algeria': 'DZ',
  'Austria': 'AT',
  'Jordan': 'JO',
  'Portugal': 'PT',
  'DR Congo': 'CD',
  'England': 'GB-ENG',
  'Croatia': 'HR',
  'Ghana': 'GH',
  'Panama': 'PA',
  'Uzbekistan': 'UZ',
  'Colombia': 'CO',
};

export default function FixturesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'group' | 'round32_16' | 'quarter_semi' | 'finals'>('all');

  const renderFlag = (team: string) => {
    const code = TEAM_COUNTRY_CODES[team.trim()];
    if (code) {
      return (
        <Image
          src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
          alt={`${team} flag`}
          className={styles.flagImage}
          width={40}
          height={30}
        />
      );
    }
    return <span className={styles.teamFlag}>🏳️</span>;
  };

  // Filter and group fixtures
  const groupedFixtures = useMemo(() => {
    const filtered = fixturesData.fixtures.filter(match => {
      // Search filter
      const matchesSearch = match.fixture.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'all') return true;
      if (activeTab === 'group') {
        return !match.stage;
      }
      if (activeTab === 'round32_16') {
        return match.stage === 'Round of 32' || match.stage === 'Round of 16';
      }
      if (activeTab === 'quarter_semi') {
        return match.stage === 'Quarter-finals' || match.stage === 'Semi-finals';
      }
      if (activeTab === 'finals') {
        return match.stage === 'Third-Place Play-Off' || match.stage === 'Final';
      }
      return true;
    });

    const groups: Record<string, typeof fixturesData.fixtures> = {};
    filtered.forEach(match => {
      if (!groups[match.date]) {
        groups[match.date] = [];
      }
      groups[match.date].push(match);
    });

    return groups;
  }, [searchQuery, activeTab]);

  // Format date function
  const formatDate = (dateStr: string) => {
    if (dateStr.includes(' - ')) return dateStr;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <div className={styles.heroSection}>
        <Image src="/images/fixturehero.jpg" alt="Fixtures" fill className={styles.heroImage} priority />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Fixtures</h1>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.headerControls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Filter by team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Grouping / Tabs switcher */}
        <div className={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('all')} 
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('group')} 
            className={`${styles.tabBtn} ${activeTab === 'group' ? styles.activeTab : ''}`}
          >
            Group Stage
          </button>
          <button 
            onClick={() => setActiveTab('round32_16')} 
            className={`${styles.tabBtn} ${activeTab === 'round32_16' ? styles.activeTab : ''}`}
          >
            R32 & R16
          </button>
          <button 
            onClick={() => setActiveTab('quarter_semi')} 
            className={`${styles.tabBtn} ${activeTab === 'quarter_semi' ? styles.activeTab : ''}`}
          >
            Quarters & Semis
          </button>
          <button 
            onClick={() => setActiveTab('finals')} 
            className={`${styles.tabBtn} ${activeTab === 'finals' ? styles.activeTab : ''}`}
          >
            Finals
          </button>
        </div>

        <div className={styles.fixturesContainer}>
          {Object.entries(groupedFixtures).map(([date, matches]) => (
            <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeader}>{formatDate(date)}</h2>

              <div className={styles.matchesList}>
                {matches.map((match, index) => {
                  const teams = match.fixture.split(' vs ');
                  const hasTeams = teams.length === 2;

                  return (
                    <div key={index} className={styles.matchRow}>
                      {hasTeams ? (
                        <>
                          {/* Left team */}
                          <div className={styles.teamBlock}>
                            {renderFlag(teams[0])}
                            <span className={styles.teamName}>{teams[0]}</span>
                          </div>

                          {/* Centre: time + VS */}
                          <div className={styles.matchCentre}>
                            <span className={styles.timeBadge}>{match.time}</span>
                            <span className={styles.vsLabel}>VS</span>
                          </div>

                          {/* Right team */}
                          <div className={`${styles.teamBlock} ${styles.teamBlockRight}`}>
                            <span className={styles.teamName}>{teams[1]}</span>
                            {renderFlag(teams[1])}
                          </div>
                        </>
                      ) : (
                        <div className={styles.tbdFixture}>
                          <span className={styles.tbdText}>{match.fixture}</span>
                          <span className={styles.timeBadge}>{match.time}</span>
                        </div>
                      )}

                      {/* Meta row */}
                      <div className={styles.matchMeta}>
                        <span>{match.stage ? match.stage : `Match ${match.matchNumber}`}</span>
                        {match.venue && (
                          <>
                            <span className={styles.metaDot}>•</span>
                            <span>📍 {match.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(groupedFixtures).length === 0 && (
            <div className={styles.noResults}>No matches found matching &quot;{searchQuery}&quot;</div>
          )}
        </div>
      </main>
    </div>
  );
}
