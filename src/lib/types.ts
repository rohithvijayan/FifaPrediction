// Firestore data model types for Goal Guru

export interface User {
  uid: string;
  name: string;
  email: string;
  total_points: number;
  correct_predictions: number;
  registered_at: Date | string;
}

export type FixtureStatus = 'NS' | 'LIVE' | '1H' | '2H' | 'HT' | 'ET' | 'P' | 'FT' | 'AET' | 'PEN' | 'VOID';
export type PredictionResult = 'H' | 'D' | 'A';

export interface Fixture {
  fixture_id: number;
  match_date: string; // YYYY-MM-DD
  kickoff_utc: Date | string;
  kickoff_ist: string; // e.g. "9:30 PM IST"
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_score: number | null;
  away_score: number | null;
  status: FixtureStatus;
  result: PredictionResult | null; // null until FT
}

export interface Prediction {
  user_id: string;
  fixture_id: number;
  predicted_result: PredictionResult;
  editable: boolean; // true until kickoff_utc
  points_earned: number;
  is_correct: boolean | null;
  submitted_at: Date | string;
}

// Extended fixture with user's prediction state (for dashboard)
export interface FixtureWithPrediction extends Fixture {
  user_prediction?: Prediction;
}

// Leaderboard entry
export interface LeaderboardEntry {
  uid: string;
  name: string;
  total_points: number;
  correct_predictions: number;
  rank: number;
  today_points?: number;
}
