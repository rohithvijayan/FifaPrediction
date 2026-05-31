'use client';

import { FixtureWithPrediction, PredictionResult } from '@/lib/types';

interface MatchCardProps {
  fixture: FixtureWithPrediction;
  onPrediction?: (fixtureId: number, result: PredictionResult) => Promise<void>;
  saving?: boolean;
}

type CardState = 'open-empty' | 'open-picked' | 'locked' | 'settled';

function getCardState(fixture: FixtureWithPrediction): CardState {
  const now = new Date();
  const kickoff = new Date(fixture.kickoff_utc);
  const isPastKickoff = now >= kickoff;

  if (fixture.status === 'FT' || fixture.result !== null) return 'settled';
  if (isPastKickoff || fixture.status === 'LIVE' || fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'HT') return 'locked';
  if (fixture.user_prediction?.predicted_result) return 'open-picked';
  return 'open-empty';
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const initials = name.slice(0, 3).toUpperCase();

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} logo`}
        className="team-logo"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return <div className="team-logo-placeholder">{initials}</div>;
}

function LiveScore({ home, away, status }: { home: number | null; away: number | null; status: string }) {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status);
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="match-score">{home ?? 0} - {away ?? 0}</div>
      {isLive && (
        <div className="match-score-minute" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div className="live-dot" />
          LIVE
        </div>
      )}
    </div>
  );
}

export default function MatchCard({ fixture, onPrediction, saving }: MatchCardProps) {
  const cardState = getCardState(fixture);
  const userPick = fixture.user_prediction?.predicted_result;
  const isCorrect = fixture.user_prediction?.is_correct;
  const pointsEarned = fixture.user_prediction?.points_earned ?? 0;

  const cardClass = `match-card match-card--${
    cardState === 'settled' ? 'settled' :
    cardState === 'locked' ? 'locked' : 'open'
  }`;

  const handlePick = async (result: PredictionResult) => {
    if (cardState !== 'open-empty' && cardState !== 'open-picked') return;
    if (saving) return;
    await onPrediction?.(fixture.fixture_id, result);
  };

  // Header tag and status label
  const kickoffTag = () => {
    if (cardState === 'settled') {
      return <span className="match-card-kickoff-tag kickoff-tag--final">FINAL RESULT</span>;
    }
    if (cardState === 'locked') {
      return <span className="match-card-kickoff-tag kickoff-tag--live">STARTED {fixture.kickoff_ist}</span>;
    }
    return <span className="match-card-kickoff-tag kickoff-tag--open">KICKOFF {fixture.kickoff_ist}</span>;
  };

  const statusLabel = () => {
    if (cardState === 'locked') {
      return (
        <span className="match-card-status">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
          Status: Locked
        </span>
      );
    }
    if (cardState === 'settled') {
      return isCorrect !== null && isCorrect !== undefined ? (
        <span className="points-chip" style={!isCorrect ? { background: 'rgba(255,180,171,0.15)', color: 'var(--color-error)' } : {}}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {isCorrect ? 'check_circle' : 'cancel'}
          </span>
          {isCorrect ? `+${pointsEarned} pts` : '0 pts'}
        </span>
      ) : null;
    }
    return (
      <span className="match-card-status">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span>
        Status: Open
      </span>
    );
  };

  return (
    <article className={cardClass} aria-label={`${fixture.home_team} vs ${fixture.away_team}`}>
      {/* Header */}
      <div className="match-card-header">
        {kickoffTag()}
        {statusLabel()}
      </div>

      {/* Teams */}
      <div className="match-card-teams">
        <div className="match-card-team">
          <TeamLogo logo={fixture.home_team_logo} name={fixture.home_team} />
          <span className="team-name">{fixture.home_team.slice(0, 3).toUpperCase()}</span>
        </div>

        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          {cardState === 'locked' ? (
            <LiveScore home={fixture.home_score} away={fixture.away_score} status={fixture.status} />
          ) : cardState === 'settled' ? (
            <div className="match-score" style={{ color: 'var(--color-on-surface)' }}>
              {fixture.home_score} - {fixture.away_score}
            </div>
          ) : (
            <span className="match-vs">VS</span>
          )}
        </div>

        <div className="match-card-team">
          <TeamLogo logo={fixture.away_team_logo} name={fixture.away_team} />
          <span className="team-name">{fixture.away_team.slice(0, 3).toUpperCase()}</span>
        </div>
      </div>

      {/* Prediction buttons or settled banner */}
      {cardState === 'settled' ? (
        <div className={`settled-banner ${isCorrect === false ? 'settled-banner--wrong' : ''}`}>
          <span className="settled-banner-text">
            {fixture.result === 'H'
              ? `Prediction Settled: ${fixture.home_team.slice(0, 3).toUpperCase()} Win`
              : fixture.result === 'A'
              ? `Prediction Settled: ${fixture.away_team.slice(0, 3).toUpperCase()} Win`
              : 'Prediction Settled: Draw'}
          </span>
        </div>
      ) : (
        <div className="prediction-buttons" role="group" aria-label="Prediction options">
          {(['H', 'D', 'A'] as PredictionResult[]).map((result) => {
            const labels: Record<PredictionResult, string> = { H: 'HOME', D: 'DRAW', A: 'AWAY' };
            const isSelected = userPick === result;
            const isDisabled = cardState === 'locked';

            return (
              <button
                key={result}
                id={`predict-${fixture.fixture_id}-${result}`}
                className={`prediction-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePick(result)}
                disabled={isDisabled || saving}
                aria-pressed={isSelected}
                aria-label={`Predict ${labels[result]} for ${fixture.home_team} vs ${fixture.away_team}`}
              >
                {saving && isSelected ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 14, animation: 'pulse 1s infinite' }}>
                    hourglass_empty
                  </span>
                ) : (
                  labels[result]
                )}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
