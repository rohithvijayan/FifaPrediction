'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import SearchSelect from '@/app/components/SearchSelect';
import { Question, Team, Player, Prediction, ActualResult } from '@/lib/types';
import styles from './predict.module.css';

const COUNTRIES = [
  { code: 'IN', name: 'India', dial: '+91', digits: 10 },
  { code: 'US', name: 'United States', dial: '+1', digits: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', digits: 10 },
  { code: 'AU', name: 'Australia', dial: '+61', digits: 9 },
  { code: 'CA', name: 'Canada', dial: '+1', digits: 10 },
  { code: 'AE', name: 'UAE', dial: '+971', digits: 9 },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', digits: 9 },
  { code: 'SG', name: 'Singapore', dial: '+65', digits: 8 },
  { code: 'MY', name: 'Malaysia', dial: '+60', digits: 10 },
  { code: 'PK', name: 'Pakistan', dial: '+92', digits: 10 },
  { code: 'BD', name: 'Bangladesh', dial: '+880', digits: 10 },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', digits: 9 },
  { code: 'NP', name: 'Nepal', dial: '+977', digits: 10 },
  { code: 'DE', name: 'Germany', dial: '+49', digits: 11 },
  { code: 'FR', name: 'France', dial: '+33', digits: 9 },
  { code: 'IT', name: 'Italy', dial: '+39', digits: 10 },
  { code: 'ES', name: 'Spain', dial: '+34', digits: 9 },
  { code: 'BR', name: 'Brazil', dial: '+55', digits: 11 },
  { code: 'MX', name: 'Mexico', dial: '+52', digits: 10 },
  { code: 'ZA', name: 'South Africa', dial: '+27', digits: 9 },
  { code: 'NG', name: 'Nigeria', dial: '+234', digits: 10 },
  { code: 'JP', name: 'Japan', dial: '+81', digits: 10 },
  { code: 'KR', name: 'South Korea', dial: '+82', digits: 10 },
  { code: 'CN', name: 'China', dial: '+86', digits: 11 },
  { code: 'ID', name: 'Indonesia', dial: '+62', digits: 11 },
  { code: 'PH', name: 'Philippines', dial: '+63', digits: 10 },
  { code: 'TH', name: 'Thailand', dial: '+66', digits: 9 },
  { code: 'VN', name: 'Vietnam', dial: '+84', digits: 9 },
  { code: 'QA', name: 'Qatar', dial: '+974', digits: 8 },
  { code: 'KW', name: 'Kuwait', dial: '+965', digits: 8 },
  { code: 'BH', name: 'Bahrain', dial: '+973', digits: 8 },
  { code: 'OM', name: 'Oman', dial: '+968', digits: 8 },
];

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
  const { user, signUp, signIn } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [actualResults, setActualResults] = useState<Record<number, ActualResult>>({});
  const [formValues, setFormValues] = useState<Record<number, Record<string, string>>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Guest Registration & Login states
  const [isLoginMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [favouriteTeam, setFavouriteTeam] = useState('');
  const [authError, setAuthError] = useState('');

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  useEffect(() => {
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

  // Auto-fill Q6 (Final Match Score) team1/team2 from Q1 (Winner) and Q2 (Runner-Up)
  useEffect(() => {
    if (questions.length === 0) return;

    const q1 = questions.find(q => q.question_number === 1);
    const q2 = questions.find(q => q.question_number === 2);
    const q6 = questions.find(q => q.question_number === 6);

    if (!q1 || !q2 || !q6) return;

    // Don't overwrite if Q6 is locked or settled
    if (new Date(q6.lock_date) <= new Date() || q6.is_settled) return;

    const winnerTeam = formValues[q1.id]?.team ?? '';
    const runnerUpTeam = formValues[q2.id]?.team ?? '';
    const currentQ6 = formValues[q6.id] ?? {};

    // Guard: only update when a value actually differs to prevent infinite loops
    if (currentQ6.team1 === winnerTeam && currentQ6.team2 === runnerUpTeam) return;

    setFormValues(prev => ({
      ...prev,
      [q6.id]: {
        ...prev[q6.id],
        team1: winnerTeam,
        team2: runnerUpTeam,
      },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, formValues]);

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
  const hasSubmittedAny = Object.keys(predictions).length > 0;
  const isQuestionLocked = (q: Question) => {
    return hasSubmittedAny || new Date(q.lock_date) <= new Date() || q.is_settled;
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

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, selectedCountry.digits);
    setPhone(digits);
  };

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setSelectedCountry(c);
    setDropdownOpen(false);
    setCountrySearch('');
    setPhone((prev) => prev.slice(0, c.digits));
  };

  const savePredictionsToDb = async (uid: string) => {
    // 1. Fetch existing predictions for this user
    const { data: existingPreds, error: fetchErr } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', uid);
    if (fetchErr) throw fetchErr;

    const predMap: Record<number, Prediction> = {};
    existingPreds?.forEach(p => {
      predMap[p.question_id] = p;
    });

    // 2. Perform write
    const promises = Object.entries(formValues).map(async ([qIdStr, val]) => {
      const qId = parseInt(qIdStr);
      const q = questions.find(question => question.id === qId);
      if (!q || isQuestionLocked(q)) return;

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

      const existing = predMap[qId];
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
            user_id: uid,
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
      .eq('user_id', uid);

    const newPredMap: Record<number, Prediction> = {};
    updatedPreds?.forEach(p => {
      newPredMap[p.question_id] = p;
    });
    setPredictions(newPredMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setAuthError('');

    // 1. Validate predictions
    let errorMessage = '';
    for (const q of questions) {
      if (isQuestionLocked(q)) continue; // Skip locked questions

      const val = formValues[q.id];
      if (q.question_number <= 3) {
        if (!val?.team) errorMessage = 'Please complete all open prediction questions before submitting.';
      } else if (q.question_number <= 5) {
        if (!val?.player || val.player === 'custom:') errorMessage = 'Please complete all open prediction questions before submitting.';
      } else if (q.question_number === 6) {
        if (!val?.team1 || !val?.team2 || val.team1_score === '' || val.team2_score === '') {
          errorMessage = 'Please complete all open prediction questions before submitting.';
        } else {
          const s1 = parseInt(val.team1_score, 10);
          const s2 = parseInt(val.team2_score, 10);
          if (s1 < 1 && s2 < 1) {
            errorMessage = 'For the Final Match, at least one score must be 1 or greater (0-0 is not allowed).';
          }
        }
      }
      if (errorMessage) break;
    }

    if (errorMessage) {
      setAlert({ type: 'error', message: errorMessage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Validate registration or login inputs if guest
    if (!user) {
      if (isLoginMode) {
        if (!regEmail.trim()) {
          setAuthError('Email is required.'); return;
        }
        if (regPassword.length < 6) {
          setAuthError('Password must be at least 6 characters.'); return;
        }
      } else {
        if (regName.trim().length < 2) {
          setAuthError('Display Name must be at least 2 characters.'); return;
        }
        if (!regEmail.trim()) {
          setAuthError('Email is required.'); return;
        }
        if (!phone.trim()) {
          setAuthError('Phone number is required.'); return;
        }
        if (phone.length !== selectedCountry.digits) {
          setAuthError(`Phone number must be exactly ${selectedCountry.digits} digits for ${selectedCountry.name}.`); return;
        }
        if (!district.trim()) {
          setAuthError('District is required.'); return;
        }
        if (!pincode.trim()) {
          setAuthError('Pincode is required.'); return;
        }
        if (!/^\d{4,10}$/.test(pincode)) {
          setAuthError('Pincode must be 4–10 digits.'); return;
        }
      }
    }

    try {
      setSubmitting(true);
      let targetUid = user?.uid;

      if (!user) {
        if (isLoginMode) {
          try {
            await signIn(regEmail.trim(), regPassword);
          } catch (signInErr) {
            try {
              const altPassword = regPassword.trim() + "Ab1!";
              await signIn(regEmail.trim(), altPassword);
            } catch {
              throw signInErr;
            }
          }
          // After sign-in, get session to obtain uid
          const { data: { session } } = await supabase.auth.getSession();
          targetUid = session?.user?.id;
          if (!targetUid) {
            throw new Error('Authentication succeeded but session could not be established.');
          }
        } else {
          // signUp now returns the user ID directly — no email confirmation needed
          const generatedPassword = phone.trim() + "Ab1!";
          const fullPhone = `${selectedCountry.dial}${phone}`;
          const newUserId = await signUp(
            regName.trim(),
            regEmail.trim(),
            generatedPassword,
            fullPhone,
            district.trim() || undefined,
            pincode || undefined,
            favouriteTeam || undefined
          );

          if (!newUserId) {
            // Fallback: try getSession in case the SDK established a session
            const { data: { session } } = await supabase.auth.getSession();
            targetUid = session?.user?.id;
            if (!targetUid) {
              throw new Error('Registration succeeded but could not obtain user ID. Please ensure "Confirm email" is disabled in your Supabase project settings.');
            }
          } else {
            targetUid = newUserId;
          }
        }
      }

      if (targetUid) {
        await savePredictionsToDb(targetUid);
        const fbq = typeof window !== 'undefined' ? (window as unknown as { fbq?: (event: string, action: string) => void }).fbq : undefined;
        if (fbq) {
          if (!user) {
            fbq('track', 'CompleteRegistration');
          }
          fbq('track', 'SubmitApplication');
        }
        setAlert({
          type: 'success',
          message: isLoginMode
            ? '🎉 Logged in and predictions saved successfully!'
            : '🎉 Account created and predictions saved successfully!'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setAuthError(errorMessage);
      setAlert({ type: 'error', message: `Submission failed: ${errorMessage}` });
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
    <>
      {/* Full-bleed Hero */}
      <div className={styles.predictHero}>
        <div className={styles.predictHeroCard}>
          <p className={styles.predictHeroEyebrow}>FIFA World Cup 2026™</p>
          <h1 className={styles.predictHeroTitle}>Predict &amp; Win</h1>
          <p className={styles.predictHeroSubtitle}>Make your picks before the deadlines!</p>
        </div>
      </div>

      <div className={styles.container}>
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

        {/* If guest, display registration or login form */}
        {!user && (
          <div className={styles.authCard}>
            <h2 className={styles.authCardTitle}>
              {isLoginMode ? 'Sign In to Save' : 'Submit Details to Lock In Predictions'}
            </h2>
            <p className={styles.authCardSubtitle}>
              {isLoginMode
                ? 'Enter your credentials to save your predictions to your account.'
                : 'Provide your details to submit your predictions and join the leaderboard!'}
            </p>

            {authError && <div className={styles.errorBanner}>⚠️ {authError}</div>}

            {!isLoginMode ? (
              // Sign Up Mode Fields
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="regName">Display Name</label>
                  <input
                    type="text"
                    id="regName"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field"
                    required
                    minLength={2}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="regEmail">Email Address</label>
                  <input
                    type="email"
                    id="regEmail"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                </div>

                {/* Country selector & phone */}
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <div className={styles.phoneRow}>
                    <div className={styles.countrySelector}>
                      <button
                        type="button"
                        className={styles.countryBtn}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={dropdownOpen}
                        aria-label="Select country code"
                      >
                        <span className={styles.flag}>
                          {String.fromCodePoint(
                            ...selectedCountry.code.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
                          )}
                        </span>
                        <span className={styles.dialCode}>{selectedCountry.dial}</span>
                        <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <div className={styles.dropdown} role="listbox">
                          <div className={styles.dropdownSearch}>
                            <input
                              type="text"
                              className={styles.dropdownInput}
                              placeholder="Search country..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                          <ul className={styles.dropdownList}>
                            {filteredCountries.length === 0 ? (
                              <li className={styles.dropdownEmpty}>No results</li>
                            ) : (
                              filteredCountries.map((c) => (
                                <li
                                  key={c.code}
                                  role="option"
                                  aria-selected={c.code === selectedCountry.code}
                                  className={`${styles.dropdownItem} ${c.code === selectedCountry.code ? styles.dropdownItemActive : ''
                                    }`}
                                  onClick={() => handleCountrySelect(c)}
                                >
                                  <span>
                                    {String.fromCodePoint(
                                      ...c.code.split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
                                    )}
                                  </span>
                                  <span className={styles.dropdownName}>{c.name}</span>
                                  <span className={styles.dropdownDial}>{c.dial}</span>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <input
                      id="phone"
                      type="tel"
                      className={`input-field ${styles.phoneInput}`}
                      placeholder={`${selectedCountry.digits}-digit number`}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                  </div>
                  <p className={styles.phoneHint}>
                  </p>
                </div>

                {/* District + Pincode Row */}
                <div className={styles.rowGroup}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="district">District</label>
                    <select
                      id="district"
                      className="input-field"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        color: district ? '#ffffff' : '#9ca3af',
                      }}
                    >
                      <option value="" style={{ color: '#9ca3af' }}>Select district...</option>
                      {[
                        'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
                        'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
                        'Thiruvananthapuram', 'Thrissur', 'Wayanad'
                      ].map((d) => (
                        <option key={d} value={d} style={{ color: '#ffffff', backgroundColor: '#0a0e1a' }}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="pincode">Pincode</label>
                    <input
                      type="text"
                      id="pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 676505"
                      className="input-field"
                      required
                      pattern="\d{4,10}"
                      title="Pincode must be 4 to 10 digits"
                    />
                  </div>
                </div>

                {/* Favourite Team */}
                <div className={styles.inputGroup}>
                  <label htmlFor="favouriteTeam">Favourite Team <span style={{fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'normal'}}>(optional)</span></label>
                  <select
                    id="favouriteTeam"
                    className="input-field"
                    value={favouriteTeam}
                    onChange={(e) => setFavouriteTeam(e.target.value)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: favouriteTeam ? '#ffffff' : '#9ca3af',
                    }}
                  >
                    <option value="" style={{ color: '#9ca3af' }}>Select your favourite team...</option>
                    {teams.map((t) => (
                      <option key={t.code} value={t.code} style={{ color: '#ffffff', backgroundColor: '#0a0e1a' }}>
                        {t.flag_emoji} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              // Login Mode Fields
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="regEmail">Email Address</label>
                  <input
                    type="email"
                    id="regEmail"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="regPassword">Password</label>
                  <input
                    type="password"
                    id="regPassword"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password or Phone Number"
                    className="input-field"
                    required
                    minLength={6}
                  />
                  <p className={styles.phoneHint} style={{ marginTop: '4px', textAlign: 'left' }}>
                    Note: If you registered without a password, enter your phone number as your password.
                  </p>
                </div>
              </>
            )}



            <div className={styles.footerActions} style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg submitBtn"
                disabled={submitting || questions.every(isQuestionLocked)}
                style={{ width: '100%' }}
              >
                {submitting ? 'Submitting...' : isLoginMode ? 'Sign In & Submit Predictions' : 'Submit Details & Predictions'}
              </button>
            </div>
          </div>
        )}

        {/* Form Action Buttons for Authenticated Users */}
        {user && !hasSubmittedAny && (
          <div className={styles.footerActions}>
            <button
              type="submit"
              className="btn btn-primary btn-lg submitBtn"
              disabled={submitting || questions.every(isQuestionLocked)}
            >
              {submitting ? 'Saving...' : 'Submit Predictions'}
            </button>
          </div>
        )}
        {user && hasSubmittedAny && (
          <div className={styles.footerActions}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%' }}>
              ✅ Your predictions have been locked in. Good luck!
            </div>
          </div>
        )}
      </form>
    </div>
    </>
  );
}
