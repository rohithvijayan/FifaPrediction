'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import styles from './fixtures.module.css';
import fixturesData from '../../../fixtures.json';

export default function FixturesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and group fixtures
  const groupedFixtures = useMemo(() => {
    const filtered = fixturesData.fixtures.filter(match =>
      match.fixture.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, typeof fixturesData.fixtures> = {};
    filtered.forEach(match => {
      if (!groups[match.date]) {
        groups[match.date] = [];
      }
      groups[match.date].push(match);
    });

    return groups;
  }, [searchQuery]);

  // Format date function
  const formatDate = (dateStr: string) => {
    if (dateStr.includes(' - ')) return dateStr; // For ranges like "June 29 - July 4, 2026"
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
          <p className={styles.heroSubtitle}>{fixturesData.tournament}</p>
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
                      <div className={styles.matchTeams}>
                        {hasTeams ? (
                          <>
                            <div className={styles.teamLeft}>{teams[0]}</div>
                            <div className={styles.matchTimeScore}>
                              <span className={styles.timeBadge}>{match.time}</span>
                            </div>
                            <div className={styles.teamRight}>{teams[1]}</div>
                          </>
                        ) : (
                          <div className={styles.tbdFixture}>
                            <span className={styles.tbdText}>{match.fixture}</span>
                            <span className={styles.timeBadge}>{match.time}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.matchMeta}>
                        <span>{match.stage ? match.stage : `Match ${match.matchNumber}`}</span>
                        {match.venue && (
                          <>
                            <span className={styles.metaDot}>•</span>
                            <span>{match.venue}</span>
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
