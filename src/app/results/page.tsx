'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase/client';
import styles from './results.module.css';

// ── Country code map for rendering flags from flagcdn ────────────────────────
const TEAM_COUNTRY_CODES: Record<string, string> = {
  'MAR': 'ma', // Morocco
  'CRO': 'hr', // Croatia
  'SCO': 'gb-sct', // Scotland
  'PER': 'pe', // Peru
  'ESP': 'es', // Spain
  'ECU': 'ec', // Ecuador
  'PAR': 'py', // Paraguay
  'UZB': 'uz', // Uzbekistan
  'ARG': 'ar', // Argentina
  'EGY': 'eg', // Egypt
  'IDN': 'id', // Indonesia
  'BIH': 'ba', // Bosnia and Herzegovina
  'FRA': 'fr', // France
  'COL': 'co', // Colombia
  'KSA': 'sa', // Saudi Arabia
  'BHR': 'bh', // Bahrain
  'BRA': 'br', // Brazil
  'AUS': 'au', // Australia
  'TUN': 'tn', // Tunisia
  'HON': 'hn', // Honduras
  'POR': 'pt', // Portugal
  'MEX': 'mx', // Mexico
  'TUR': 'tr', // Türkiye
  'KEN': 'ke', // Kenya
  'GER': 'de', // Germany
  'CHI': 'cl', // Chile
  'JPN': 'jp', // Japan
  'CAN': 'ca', // Canada
  'ENG': 'gb-eng', // England
  'SEN': 'sn', // Senegal
  'HAI': 'ht', // Haiti
  'WAL': 'gb-wls', // Wales
  'URU': 'uy', // Uruguay
  'IRN': 'ir', // Iran
  'KOR': 'kr', // South Korea
  'TRI': 'tt', // Trinidad and Tobago
  'BEL': 'be', // Belgium
  'NGA': 'ng', // Nigeria
  'CRC': 'cr', // Costa Rica
  'ALB': 'al', // Albania
  'NED': 'nl', // Netherlands
  'CMR': 'cm', // Cameroon
  'PAN': 'pa', // Panama
  'SRB': 'rs', // Serbia
  'USA': 'us', // USA
  'BOL': 'bo', // Bolivia
  'ITA': 'it', // Italy
  'SVN': 'si', // Slovenia
};

interface StandingRow {
  id: number;
  group_name: string;
  team_name: string;
  team_code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
  updated_at: string;
}

export default function ResultsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroupTab, setActiveGroupTab] = useState<string>('ALL');

  useEffect(() => {
    async function fetchStandings() {
      try {
        const { data, error } = await supabase
          .from('group_standings')
          .select('*')
          .order('group_name', { ascending: true })
          .order('points', { ascending: false })
          .order('goal_difference', { ascending: false })
          .order('goals_for', { ascending: false })
          .order('team_name', { ascending: true });

        if (error) throw error;
        if (data) {
          setStandings(data);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, []);

  const renderFlag = (teamCode: string) => {
    const code = TEAM_COUNTRY_CODES[teamCode.toUpperCase()];
    if (code) {
      return (
        <img
          src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
          alt={`${teamCode} flag`}
          className={styles.flagImage}
        />
      );
    }
    return <span className={styles.teamFlagEmoji}>🏳️</span>;
  };

  // Group letters A through L
  const groupTabs = useMemo(() => {
    return ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  }, []);

  // Filter and organize standings by Group
  const groupedData = useMemo(() => {
    // 1. Filter by search query (if any matches team name or code)
    let filtered = standings;
    if (searchQuery.trim()) {
      filtered = standings.filter(
        (row) =>
          row.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.team_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Separate into groups
    const groups: Record<string, StandingRow[]> = {};
    filtered.forEach((row) => {
      // Normalise group name representation
      let gName = row.group_name;
      if (!gName.startsWith('Group ')) {
        gName = `Group ${gName}`;
      }

      // Tab filter
      const groupLetter = gName.replace('Group ', '').trim();
      if (activeGroupTab !== 'ALL' && groupLetter !== activeGroupTab) {
        return;
      }

      if (!groups[gName]) {
        groups[gName] = [];
      }
      groups[gName].push(row);
    });

    // Sort teams within each group to ensure positions are correct (1-4)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
        return a.team_name.localeCompare(b.team_name);
      });
    });

    return groups;
  }, [standings, searchQuery, activeGroupTab]);

  const lastUpdatedText = useMemo(() => {
    if (standings.length === 0) return null;
    const dates = standings.map((s) => new Date(s.updated_at).getTime());
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  }, [standings]);

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <div className={styles.heroSection}>
        <Image 
          src="/images/rulesBG1.jpg" 
          alt="Group Standings Hero" 
          fill 
          className={styles.heroImage} 
          priority 
        />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={`${styles.heroTitle} anek-malayalam`}>ഗ്രൂപ്പ് നില</h1>
          <p className={`${styles.heroSubtitle} anek-malayalam`}>FIFA World Cup 2026 Standings</p>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.headerControls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search for a team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.tabContainer}>
            {groupTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveGroupTab(tab)}
                className={`${styles.tabBtn} ${activeGroupTab === tab ? styles.activeTab : ''}`}
              >
                {tab === 'ALL' ? 'All Groups' : `Group ${tab}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className="anek-malayalam">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>
          </div>
        ) : Object.keys(groupedData).length > 0 ? (
          <>
            {lastUpdatedText && (
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem', fontWeight: 600 }}>
                Last updated: {lastUpdatedText}
              </div>
            )}
            <div className={styles.standingsGrid}>
              {Object.entries(groupedData).map(([groupName, teams]) => (
                <div key={groupName} className={styles.groupCard}>
                  <div className={styles.groupHeader}>
                    <h2 className={`${styles.groupTitle} anek-malayalam`}>{groupName}</h2>
                    <span className={styles.groupBadge}>Stage 1</span>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.standingsTable}>
                      <thead>
                        <tr>
                          <th className={styles.posCol}>#</th>
                          <th className={styles.teamCol}>Team</th>
                          <th className={styles.statsCol}>P</th>
                          <th className={styles.statsCol}>W</th>
                          <th className={styles.statsCol}>D</th>
                          <th className={styles.statsCol}>L</th>
                          <th className={styles.gdCol}>GD</th>
                          <th className={styles.ptsCol}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((team, idx) => {
                          const position = idx + 1;
                          const posClass = position === 1 ? styles.pos1 : position === 2 ? styles.pos2 : '';
                          const isHighlighted = searchQuery.trim() !== '' && (
                            team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            team.team_code.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          return (
                            <tr 
                              key={team.id} 
                              className={`${styles.tableRow} ${posClass} ${isHighlighted ? styles.highlightRow : ''}`}
                            >
                              <td className={styles.posCol}>{position}</td>
                              <td className={styles.teamCol}>
                                <div className={styles.teamCell}>
                                  {renderFlag(team.team_code)}
                                  <span className={styles.teamNameText} title={team.team_name}>
                                    {team.team_name}
                                  </span>
                                  <span className={styles.teamCodeText}>{team.team_code}</span>
                                </div>
                              </td>
                              <td className={styles.statsCol}>{team.played}</td>
                              <td className={styles.statsCol}>{team.won}</td>
                              <td className={styles.statsCol}>{team.drawn}</td>
                              <td className={styles.statsCol}>{team.lost}</td>
                              <td className={styles.gdCol}>{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                              <td className={styles.ptsCol}>{team.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.noResults}>
            <p className="anek-malayalam">ഗ്രൂപ്പ് വിവരങ്ങൾ ലഭ്യമല്ല.</p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Standings will be updated once matches begin!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
