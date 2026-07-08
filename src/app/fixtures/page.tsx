'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase/client';
import styles from './fixtures.module.css';
import fixturesData from '../../../fixtures.json';

interface FixtureItem {
  matchNumber: number | string;
  stage?: string;
  date: string;
  time: string;
  fixture: string;
  venue?: string;
  status?: string;
  result?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
}

// ── Country codes map for all 48 WC 2026 teams ──────────────────────────────────
const TEAM_COUNTRY_CODES: Record<string, string> = {
  'Mexico': 'MX',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'Czechia': 'CZ',
  'Canada': 'CA',
  'Bosnia and Herzegovina': 'BA',
  'USA': 'US',
  'United States': 'US',
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

const parseScores = (result: string | null | undefined, team1: string, team2: string) => {
  if (!result) return { score1: null, score2: null };
  let scorePart = result;
  scorePart = scorePart.replace(team1.trim(), '');
  scorePart = scorePart.replace(team2.trim(), '');
  const scores = scorePart.match(/\d+/g);
  if (scores && scores.length === 2) {
    return { score1: scores[0], score2: scores[1] };
  }
  return { score1: null, score2: null };
};

interface KnockoutMatchItem {
  id: number;
  match_number: string;
  stage: string;
  match_date: string;
  match_time: string;
  fixture: string;
  home_team: string;
  home_team_code: string;
  away_team: string;
  away_team_code: string;
  home_score: number | null;
  away_score: number | null;
  home_penalty_score: number | null;
  away_penalty_score: number | null;
  status: string;
  venue: string;
  result_text: string | null;
  updated_at: string;
}

export default function FixturesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'group' | 'round32_16' | 'quarter_semi' | 'finals'>('all');
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatchItem[]>([]);

  // Fetch live knockout matches from database
  useEffect(() => {
    async function fetchKnockout() {
      try {
        const { data, error } = await supabase
          .from('knockout_stage_results')
          .select('*')
          .order('match_number', { ascending: true });
        if (error) {
          console.warn('Error fetching knockout stage results:', error.message);
        }
        if (data) {
          setKnockoutMatches(data as KnockoutMatchItem[]);
        }
      } catch (err) {
        console.error('Error fetching knockout matches:', err);
      }
    }
    fetchKnockout();
  }, []);

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
    // 1. Group stage matches (matches 1 to 72) from fixturesData.fixtures JSON
    const groupMatches = (fixturesData.fixtures as FixtureItem[]).filter(match => {
      const matchNum = Number(match.matchNumber);
      return !isNaN(matchNum) && matchNum <= 72;
    });

    // 2. Knockout stage matches from the database (or fallback if empty)
    let knockoutList: FixtureItem[] = [];
    if (knockoutMatches.length > 0) {
      knockoutList = knockoutMatches.map(m => ({
        matchNumber: Number(m.match_number),
        stage: m.stage,
        date: m.match_date,
        time: m.match_time,
        fixture: m.fixture,
        venue: m.venue,
        status: m.status === 'FT' ? 'Final' : m.status,
        result: m.result_text,
        homeScore: m.home_score,
        awayScore: m.away_score,
        homePenalty: m.home_penalty_score,
        awayPenalty: m.away_penalty_score
      }));
    } else {
      // Fallback to local fixtures json knockout matches if db call hasn't finished
      knockoutList = (fixturesData.fixtures as FixtureItem[]).filter(match => {
        const matchNum = Number(match.matchNumber);
        return isNaN(matchNum) || matchNum > 72;
      });
    }

    const allMatches = [...groupMatches, ...knockoutList];

    const filtered = allMatches.filter(match => {
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

    const groups: Record<string, FixtureItem[]> = {};
    filtered.forEach(match => {
      if (!groups[match.date]) {
        groups[match.date] = [];
      }
      groups[match.date].push(match);
    });

    return groups;
  }, [knockoutMatches, searchQuery, activeTab]);

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
                {matches.map((match: FixtureItem, index) => {
                  const teams = match.fixture.split(' vs ');
                  const hasTeams = teams.length === 2;

                  const isFinal = match.status === 'Final';
                  
                  let score1: string | number | null = null;
                  let score2: string | number | null = null;

                  if (isFinal) {
                    if (match.homeScore !== undefined && match.homeScore !== null) {
                      if (match.homePenalty !== undefined && match.homePenalty !== null) {
                        score1 = `${match.homeScore} (${match.homePenalty})`;
                        score2 = `${match.awayScore ?? ''} (${match.awayPenalty ?? ''})`;
                      } else {
                        score1 = match.homeScore ?? null;
                        score2 = match.awayScore ?? null;
                      }
                    } else if (match.result) {
                      const parsed = parseScores(match.result, teams[0], teams[1]);
                      score1 = parsed.score1;
                      score2 = parsed.score2;
                    }
                  }

                  return (
                    <div key={index} className={styles.matchRow}>
                      {hasTeams ? (
                        <>
                          {/* Left team */}
                          <div className={styles.teamBlock}>
                            {renderFlag(teams[0])}
                            <span className={styles.teamName}>{teams[0]}</span>
                            {score1 !== null && <span className={styles.teamScore}>{score1}</span>}
                          </div>

                          {/* Centre: time + VS */}
                          <div className={styles.matchCentre}>
                            {isFinal ? (
                              <span className={styles.finalBadge}>Final</span>
                            ) : (
                              <>
                                <span className={styles.timeBadge}>{match.time}</span>
                                <span className={styles.vsLabel}>VS</span>
                              </>
                            )}
                          </div>

                          {/* Right team */}
                          <div className={`${styles.teamBlock} ${styles.teamBlockRight}`}>
                            {score2 !== null && <span className={styles.teamScoreRight}>{score2}</span>}
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
