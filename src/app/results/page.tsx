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

interface GoldenBootRow {
  id: number;
  rank: number;
  player_name: string;
  team_code: string;
  goals: number;
  assists: number;
  minutes_played: number;
  position: string;
  updated_at: string;
}

interface KnockoutMatch {
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

export default function ResultsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [goldenBoot, setGoldenBoot] = useState<GoldenBootRow[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [activeView, setActiveView] = useState<'standings' | 'golden_boot' | 'knockout'>('standings');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroupTab, setActiveGroupTab] = useState<string>('ALL');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch standings
        const { data: standingsData, error: standingsErr } = await supabase
          .from('group_standings')
          .select('*')
          .order('group_name', { ascending: true })
          .order('points', { ascending: false })
          .order('goal_difference', { ascending: false })
          .order('goals_for', { ascending: false })
          .order('team_name', { ascending: true });

        if (standingsErr) throw standingsErr;
        if (standingsData) {
          setStandings(standingsData);
        }

        // Fetch golden boot stats
        const { data: bootData, error: bootErr } = await supabase
          .from('golden_boot_standings')
          .select('*')
          .order('rank', { ascending: true });

        if (!bootErr && bootData) {
          setGoldenBoot(bootData);
        }

        // Fetch knockout stage results
        const { data: knockoutData, error: knockoutErr } = await supabase
          .from('knockout_stage_results')
          .select('*')
          .order('id', { ascending: true });

        if (!knockoutErr && knockoutData) {
          setKnockoutMatches(knockoutData);
        }
      } catch (err) {
        console.error('Error fetching standings, golden boot, and knockout:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const renderFlag = (teamCode: string) => {
    const code = TEAM_COUNTRY_CODES[teamCode.toUpperCase()];
    if (code) {
      return (
        <Image
          src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
          alt={`${teamCode} flag`}
          className={styles.flagImage}
          width={40}
          height={30}
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

  // Group and sort knockout matches by stage
  const groupedKnockout = useMemo(() => {
    const groups: Record<string, KnockoutMatch[]> = {
      'Round of 32': [],
      'Round of 16': [],
      'Quarter-finals': [],
      'Semi-finals': [],
      'Third-Place Play-Off': [],
      'Final': []
    };

    knockoutMatches.forEach((match) => {
      let stageKey = match.stage;
      if (stageKey.toLowerCase().includes('round of 32')) stageKey = 'Round of 32';
      else if (stageKey.toLowerCase().includes('round of 16')) stageKey = 'Round of 16';
      else if (stageKey.toLowerCase().includes('quarter')) stageKey = 'Quarter-finals';
      else if (stageKey.toLowerCase().includes('semi')) stageKey = 'Semi-finals';
      else if (stageKey.toLowerCase().includes('third')) stageKey = 'Third-Place Play-Off';
      else if (stageKey.toLowerCase().includes('final')) stageKey = 'Final';

      if (groups[stageKey]) {
        groups[stageKey].push(match);
      } else {
        if (!groups[stageKey]) groups[stageKey] = [];
        groups[stageKey].push(match);
      }
    });

    // Sort matches within each stage by match_number
    Object.keys(groups).forEach((stage) => {
      groups[stage].sort((a, b) => {
        const numA = parseInt(a.match_number) || 0;
        const numB = parseInt(b.match_number) || 0;
        return numA - numB;
      });
    });

    return groups;
  }, [knockoutMatches]);

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
        {/* Main View Selector */}
        <div className={styles.viewSelector}>
          <button
            onClick={() => {
              setActiveView('standings');
              setSearchQuery('');
            }}
            className={`${styles.viewBtn} ${activeView === 'standings' ? styles.activeViewBtn : ''}`}
          >
            ⚽ Group Standings
          </button>
          <button
            onClick={() => {
              setActiveView('knockout');
              setSearchQuery('');
            }}
            className={`${styles.viewBtn} ${activeView === 'knockout' ? styles.activeViewBtn : ''}`}
          >
            🌳 Knockout Stage
          </button>
          <button
            onClick={() => {
              setActiveView('golden_boot');
              setSearchQuery('');
            }}
            className={`${styles.viewBtn} ${activeView === 'golden_boot' ? styles.activeViewBtn : ''}`}
          >
            🏆 Golden Boot
          </button>
        </div>

        {activeView === 'standings' ? (
          <>
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
          </>
        ) : activeView === 'golden_boot' ? (
          /* Render Golden Boot standings */
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className="anek-malayalam">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>
              </div>
            ) : goldenBoot.length > 0 ? (
              <div className={styles.groupCard} style={{ padding: '2rem' }}>
                <div className={styles.groupHeader}>
                  <h2 className={`${styles.groupTitle} anek-malayalam`}>adidas Golden Boot Standings</h2>
                  <span className={styles.groupBadge} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>Top Scorers</span>
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.standingsTable}>
                    <thead>
                      <tr>
                        <th className={styles.posCol}>Rank</th>
                        <th>Player</th>
                        <th style={{ textAlign: 'center' }}>Team</th>
                        <th style={{ textAlign: 'center' }}>Goals</th>
                        <th style={{ textAlign: 'center' }}>Assists</th>
                        <th style={{ textAlign: 'center' }}>Mins Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goldenBoot.map((player) => (
                        <tr key={player.id} className={styles.tableRow}>
                          <td className={styles.posCol} style={{ color: '#eab308', fontWeight: 'bold' }}>#{player.rank}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>{player.player_name}</span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{player.position}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                              {renderFlag(player.team_code)}
                              <span style={{ fontWeight: 600 }}>{player.team_code}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#eab308', fontSize: '1.05rem' }}>{player.goals}</td>
                          <td style={{ textAlign: 'center' }}>{player.assists}</td>
                          <td style={{ textAlign: 'center', color: '#9ca3af' }}>{player.minutes_played}&apos;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={styles.noResults}>
                <p className="anek-malayalam">ഗോൾഡൻ ബൂട്ട് വിവരങ്ങൾ ലഭ്യമല്ല.</p>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Golden Boot standings will be updated live as goals are scored!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Render Knockout Stage results */
          <div style={{ width: '100%' }}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className="anek-malayalam">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>
              </div>
            ) : knockoutMatches.length > 0 ? (
              <div className={styles.knockoutGrid}>
                {Object.entries(groupedKnockout).map(([stageName, matches]) => {
                  if (matches.length === 0) return null;
                  return (
                    <div key={stageName} className={styles.stageSection}>
                      <div className={styles.stageHeader}>
                        <h2 className={`${styles.stageTitleText} anek-malayalam`}>
                          {stageName === 'Round of 32' ? 'റൗണ്ട് ഓഫ് 32' : 
                           stageName === 'Round of 16' ? 'റൗണ്ട് ഓഫ് 16' : 
                           stageName === 'Quarter-finals' ? 'ക്വാർട്ടർ ഫൈനൽ' : 
                           stageName === 'Semi-finals' ? 'സെമി ഫൈനൽ' : 
                           stageName === 'Third-Place Play-Off' ? 'ലൂസേഴ്സ് ഫൈനൽ' : 
                           'ഫൈനൽ'}
                        </h2>
                        <span className={styles.groupBadge}>{stageName}</span>
                      </div>

                      <div className={styles.matchCardsGrid}>
                        {matches.map((match) => (
                          <div key={match.id} className={styles.matchCard}>
                            <div className={styles.matchCardHeader}>
                              <span className={styles.matchNumberBadge}>Match #{match.match_number}</span>
                              <span>{match.match_date} • {match.match_time}</span>
                              <span className={`${styles.matchStatusBadge} ${match.status === 'FT' ? styles.statusFT : styles.statusUpcoming}`}>
                                {match.status}
                              </span>
                            </div>

                            <div className={styles.matchBody}>
                              {/* Home Team */}
                              <div className={styles.matchTeam}>
                                {match.home_team_code && match.home_team_code !== 'TBD' ? (
                                  <div className={styles.matchTeamFlag}>
                                    {renderFlag(match.home_team_code)}
                                  </div>
                                ) : (
                                  <span className={styles.matchTeamFlagEmoji}>🏳️</span>
                                )}
                                <span className={styles.matchTeamName} title={match.home_team}>{match.home_team}</span>
                                <span className={styles.matchTeamCode}>{match.home_team_code}</span>
                              </div>

                              {/* Score Area */}
                              <div className={styles.matchScoreArea}>
                                <div className={styles.matchScoreDisplay}>
                                  <span>{match.home_score !== null ? match.home_score : '-'}</span>
                                  <span className={styles.matchScoreSeparator}>:</span>
                                  <span>{match.away_score !== null ? match.away_score : '-'}</span>
                                </div>
                                {(match.home_penalty_score !== null || match.away_penalty_score !== null) && (
                                  <div className={styles.penaltyDisplay}>
                                    ({match.home_penalty_score} - {match.away_penalty_score} Pens)
                                  </div>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className={styles.matchTeam}>
                                {match.away_team_code && match.away_team_code !== 'TBD' ? (
                                  <div className={styles.matchTeamFlag}>
                                    {renderFlag(match.away_team_code)}
                                  </div>
                                ) : (
                                  <span className={styles.matchTeamFlagEmoji}>🏳️</span>
                                )}
                                <span className={styles.matchTeamName} title={match.away_team}>{match.away_team}</span>
                                <span className={styles.matchTeamCode}>{match.away_team_code}</span>
                              </div>
                            </div>

                            <div className={styles.matchCardFooter}>
                              <div className={styles.matchVenue}>
                                📍 {match.venue || 'TBD Venue'}
                              </div>
                              {match.result_text && (
                                <div className={styles.matchResultText}>
                                  {match.result_text}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p className="anek-malayalam font-bold text-lg">നോക്കൗട്ട് വിവരങ്ങൾ ലഭ്യമല്ല.</p>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Knockout Stage results will be updated live as they finish!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
