'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import SearchSelect from '@/app/components/SearchSelect';
import { Question, Team, Player, Prediction, ActualResult } from '@/lib/types';
import styles from './predict.module.css';

// SVG Icons for each question
const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 0-6 6v5a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6z" />
  </svg>
);

const SilverTrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BootIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v-2a2 2 0 1 1 4 0v2" />
    <path d="M14 16v-2a2 2 0 1 1 4 0v2" />
    <path d="M3 12h18v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4z" />
    <path d="M12 4v4" />
    <path d="M8 6h8" />
  </svg>
);

const GloveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18V9a4 4 0 0 1 8 0v9" />
    <path d="M6 14h8" />
    <path d="M10 10V6a2 2 0 0 1 4 0v4" />
    <path d="M18 12V9a2 2 0 0 0-4 0v3" />
    <path d="M4 18h12a2 2 0 0 1 2 2v2H2v-2a2 2 0 0 1 2-2z" />
  </svg>
);

const ScoreboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

export default function PredictPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [actualResults, setActualResults] = useState<Record<number, ActualResult>>({});
  const [formValues, setFormValues] = useState<Record<number, Record<string, string>>>({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        setLoading(true);
        setAlert(null);

        // 1. Fetch questions
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .order('question_number', { ascending: true });
        if (qErr) throw qErr;

        // 2. Fetch teams
        const { data: tData, error: tErr } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true });
        if (tErr) throw tErr;

        // 3. Fetch players
        const { data: pData, error: pErr } = await supabase
          .from('players')
          .select('*')
          .order('name', { ascending: true });
        if (pErr) throw pErr;

        // 4. Fetch user predictions
        const predMap: Record<number, Prediction> = {};
        if (user && user.uid) {
          const { data: predData, error: predErr } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.uid);
          if (predErr) throw predErr;

          // Index predictions by question_id
          predData?.forEach(p => {
            predMap[p.question_id] = p;
          });
          setPredictions(predMap);
        }

        // 5. Fetch actual results (for settled questions)
        const { data: actData, error: actErr } = await supabase
          .from('actual_results')
          .select('*');
        if (actErr) throw actErr;

        setQuestions(qData || []);
        setTeams(tData || []);
        setPlayers(pData || []);


        // Index actual results by question_id
        const actMap: Record<number, ActualResult> = {};
        actData?.forEach(a => {
          actMap[a.question_id] = a;
        });
        setActualResults(actMap);

        // Prepopulate form values from predictions
        const initialFormValues: Record<number, Record<string, string>> = {};
        qData?.forEach(q => {
          const pred = predMap[q.id];
          if (pred) {
            const answer = pred.answer as unknown as Record<string, string>;
            if (q.question_number <= 3) {
              initialFormValues[q.id] = { team: answer.team || '' };
            } else if (q.question_number <= 5) {
              // Check if prediction player matches a seeded player
              const playerExists = pData?.some(p => p.name === answer.player);
              if (playerExists) {
                initialFormValues[q.id] = { player: answer.player || '' };
              } else if (answer.player) {
                initialFormValues[q.id] = { player: `custom:${answer.player}` };
              } else {
                initialFormValues[q.id] = { player: '' };
              }
            } else if (q.question_number === 6) {
              initialFormValues[q.id] = {
                team1: answer.team1 || '',
                team2: answer.team2 || '',
                team1_score: answer.team1_score !== undefined ? answer.team1_score.toString() : '',
                team2_score: answer.team2_score !== undefined ? answer.team2_score.toString() : ''
              };
            }
          } else {
            // Set defaults
            if (q.question_number <= 3) {
              initialFormValues[q.id] = { team: '' };
            } else if (q.question_number <= 5) {
              initialFormValues[q.id] = { player: '' };
            } else if (q.question_number === 6) {
              initialFormValues[q.id] = { team1: '', team2: '', team1_score: '', team2_score: '' };
            }
          }
        });
        setFormValues(initialFormValues);
      } catch (err: unknown) {
        console.error('Error fetching prediction page data:', err);
        setAlert({ type: 'error', message: 'Failed to load page data. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const getTeamFlag = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    return team ? team.flag_emoji : '';
  };

  const getTeamFlagByCode = (teamCode: string) => {
    const team = teams.find(t => t.code === teamCode);
    return team ? team.flag_emoji : '';
  };

  // Build searchable dropdown options
  const teamOptions = teams.map(t => ({
    value: t.name,
    label: t.name,
    emoji: t.flag_emoji
  }));

  // Deduplicate players by name to prevent React key collision and duplicate options
  const uniquePlayers = Array.from(new Map(players.map(p => [p.name, p])).values());

  const goldenBootOptions = uniquePlayers
    .filter(p => !p.is_goalkeeper)
    .map(p => ({
      value: p.name,
      label: `${p.name} (${p.team_code})`,
      emoji: getTeamFlagByCode(p.team_code) || '🏃'
    }));

  const goldenGloveOptions = uniquePlayers
    .filter(p => p.is_goalkeeper)
    .map(p => ({
      value: p.name,
      label: `${p.name} (${p.team_code})`,
      emoji: getTeamFlagByCode(p.team_code) || '🧤'
    }));

  // Helper to check if a question is locked
  const isQuestionLocked = (q: Question) => {
    return new Date(q.lock_date) <= new Date() || q.is_settled;
  };

  const handleInputChange = (qId: number, field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    let hasEmpty = false;
    questions.forEach(q => {
      if (isQuestionLocked(q)) return; // Skip locked questions

      const val = formValues[q.id];
      if (q.question_number <= 3) {
        if (!val?.team) hasEmpty = true;
      } else if (q.question_number <= 5) {
        if (!val?.player || val.player === 'custom:') hasEmpty = true;
      } else if (q.question_number === 6) {
        if (!val?.team1 || !val?.team2 || val.team1_score === '' || val.team2_score === '') {
          hasEmpty = true;
        }
      }
    });

    if (hasEmpty) {
      setAlert({ type: 'error', message: 'Please complete all open prediction questions before submitting.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);

      const promises = Object.entries(formValues).map(async ([qIdStr, val]) => {
        const qId = parseInt(qIdStr);
        const q = questions.find(question => question.id === qId);
        if (!q || isQuestionLocked(q)) return; // Don't write if locked

        let answer: Record<string, string | number> = {};
        if (q.question_number <= 3) {
          answer = { team: val.team };
        } else if (q.question_number <= 5) {
          const pName = val.player.startsWith('custom:')
            ? val.player.replace('custom:', '').trim()
            : val.player;
          answer = { player: pName };
        } else if (q.question_number === 6) {
          answer = {
            team1: val.team1,
            team2: val.team2,
            team1_score: parseInt(val.team1_score),
            team2_score: parseInt(val.team2_score)
          };
        }

        const existing = predictions[qId];
        if (existing) {
          const { error } = await supabase
            .from('predictions')
            .update({
              answer,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('predictions')
            .insert({
              user_id: user.uid,
              question_id: qId,
              answer,
              submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (error) throw error;
        }
      });

      await Promise.all(promises);

      // Refresh predictions state from database
      const { data: updatedPreds } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.uid);

      const predMap: Record<number, Prediction> = {};
      updatedPreds?.forEach(p => {
        predMap[p.question_id] = p;
      });
      setPredictions(predMap);

      setAlert({ type: 'success', message: '🎉 Your predictions have been saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setAlert({ type: 'error', message: `Failed to save predictions: ${errorMessage}` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (qNum: number) => {
    switch (qNum) {
      case 1: return <TrophyIcon />;
      case 2: return <SilverTrophyIcon />;
      case 3: return <ShieldIcon />;
      case 4: return <BootIcon />;
      case 5: return <GloveIcon />;
      case 6: return <ScoreboardIcon />;
      default: return <TrophyIcon />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading predictions form...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Predict & Win</h1>
        <p className={styles.subtitle}>
          Make your tournament predictions before deadlines to climb the leaderboard!
        </p>
      </div>

      {alert && (
        <div className={`${styles.alert} ${alert.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.cardList}>
          {questions.map((q, index) => {
            const isLocked = isQuestionLocked(q);
            const isSettled = q.is_settled;
            const pred = predictions[q.id];
            const correctRes = actualResults[q.id];
            const correctAns = correctRes?.answer as unknown as Record<string, string | number> | undefined;
            const value = formValues[q.id] || {};

            return (
              <div 
                key={q.id} 
                className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
                style={{ zIndex: questions.length - index }}
              >
                {/* Status Badge */}
                {isSettled && (
                  <div className={styles.badgeContainer}>
                    <span className={styles.badgeOpen} style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-mint)', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                      SETTLED
                    </span>
                  </div>
                )}

                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    {getIcon(q.question_number)}
                  </div>
                  <div className={styles.headerText}>
                    <div className={styles.questionMeta}>
                      <span className={styles.questionNum}>Question {q.question_number}</span>
                      <span className={styles.pointsBadge}>{q.max_points} Points</span>
                    </div>
                    <h2 className={styles.questionTitle}>{q.title}</h2>
                    {q.description && <p className={styles.cardDescription}>{q.description}</p>}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {/* Q1, Q2, Q3 Input fields */}
                  {q.question_number <= 3 && (
                    <SearchSelect
                      options={teamOptions}
                      value={value.team || ''}
                      onChange={(val) => handleInputChange(q.id, 'team', val)}
                      placeholder="Select a country..."
                      disabled={isLocked}
                    />
                  )}

                  {/* Q4 Input fields */}
                  {q.question_number === 4 && (
                    <SearchSelect
                      options={goldenBootOptions}
                      value={value.player || ''}
                      onChange={(val) => handleInputChange(q.id, 'player', val)}
                      placeholder="Select a player..."
                      allowCustom
                      customPlaceholder="Type player name..."
                      disabled={isLocked}
                    />
                  )}

                  {/* Q5 Input fields */}
                  {q.question_number === 5 && (
                    <SearchSelect
                      options={goldenGloveOptions}
                      value={value.player || ''}
                      onChange={(val) => handleInputChange(q.id, 'player', val)}
                      placeholder="Select a goalkeeper..."
                      allowCustom
                      customPlaceholder="Type goalkeeper name..."
                      disabled={isLocked}
                    />
                  )}

                  {/* Q6 Input fields */}
                  {q.question_number === 6 && (
                    <div className={styles.scorecardContainer}>
                      <div className={styles.scorecardRow}>
                        {/* Team 1 Selection */}
                        <div className={styles.teamSide}>
                          <span className={styles.teamSideLabel}>Finalist A</span>
                          <SearchSelect
                            options={teamOptions}
                            value={value.team1 || ''}
                            onChange={(val) => handleInputChange(q.id, 'team1', val)}
                            placeholder="Select Team A..."
                            disabled={isLocked}
                          />
                        </div>

                        {/* Score Inputs */}
                        <div className={styles.vsContainer}>
                          <div className={styles.scoreInputContainer}>
                            <span className={styles.scoreInputLabel}>Score</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={value.team1_score ?? ''}
                              onChange={(e) => handleInputChange(q.id, 'team1_score', e.target.value)}
                              className={styles.scoreInput}
                              placeholder="0"
                              disabled={isLocked}
                              required
                            />
                          </div>
                          <span className={styles.vsBadge}>VS</span>
                          <div className={styles.scoreInputContainer}>
                            <span className={styles.scoreInputLabel}>Score</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={value.team2_score ?? ''}
                              onChange={(e) => handleInputChange(q.id, 'team2_score', e.target.value)}
                              className={styles.scoreInput}
                              placeholder="0"
                              disabled={isLocked}
                              required
                            />
                          </div>
                        </div>

                        {/* Team 2 Selection */}
                        <div className={styles.teamSide}>
                          <span className={styles.teamSideLabel}>Finalist B</span>
                          <SearchSelect
                            options={teamOptions}
                            value={value.team2 || ''}
                            onChange={(val) => handleInputChange(q.id, 'team2', val)}
                            placeholder="Select Team B..."
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settled view and points details */}
                  {isSettled && (
                    <>
                      {pred && (
                        <div className={styles.pointsEarned}>
                          Points Earned: {pred.points_earned} / {q.max_points}
                        </div>
                      )}
                      {correctRes && correctAns && (
                        <div className={styles.correctAnswer}>
                          <div className={styles.correctAnswerLabel}>Correct Result</div>
                          <div className={styles.correctAnswerText}>
                            {q.question_number <= 3 && (
                              <span>
                                {getTeamFlag(correctAns.team as string)} {correctAns.team}
                              </span>
                            )}
                            {(q.question_number === 4 || q.question_number === 5) && (
                              <span>{correctAns.player}</span>
                            )}
                            {q.question_number === 6 && (
                              <span>
                                {getTeamFlag(correctAns.team1 as string)} {correctAns.team1} ({correctAns.team1_score}) - ({correctAns.team2_score}) {getTeamFlag(correctAns.team2 as string)} {correctAns.team2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Action Buttons */}
        <div className={styles.footerActions}>
          <button
            type="submit"
            className="btn btn-primary btn-lg submitBtn"
            disabled={submitting || questions.every(isQuestionLocked)}
          >
            {submitting ? 'Saving...' : 'Submit Predictions'}
          </button>
        </div>
      </form>
    </div>
  );
}
