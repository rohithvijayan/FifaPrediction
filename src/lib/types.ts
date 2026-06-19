// ⚽ Type definitions for പന്തഭ്രനിയ (Goal Guru)

// ============================================================
// Database row types
// ============================================================

export interface User {
  uid: string;
  name: string;
  email: string;
  favourite_team?: string;
  total_points: number;
  is_admin: boolean;
  registered_at: string;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
  group_name: string;
}

export interface Player {
  id: number;
  name: string;
  team_code: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  is_goalkeeper: boolean;
}

export interface Question {
  id: number;
  question_number: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  description: string | null;
  max_points: number;
  lock_date: string; // ISO timestamp
  is_settled: boolean;
  created_at: string;
}

// ============================================================
// Answer shapes (stored as JSONB in predictions.answer)
// ============================================================

export interface Q1Answer {
  team: string; // Team name
}

export interface Q2Answer {
  team: string; // Team name
}

export interface Q3Answer {
  team: string; // Team name
}

export interface Q4Answer {
  player: string; // Player name
}

export interface Q5Answer {
  player: string; // Player name
}

export interface Q6Answer {
  team1: string;
  team2: string;
  team1_score: number;
  team2_score: number;
}

export type PredictionAnswer = Q1Answer | Q2Answer | Q3Answer | Q4Answer | Q5Answer | Q6Answer;

// ============================================================
// Prediction row
// ============================================================

export interface Prediction {
  id: string;
  user_id: string;
  question_id: number;
  answer: PredictionAnswer;
  points_earned: number;
  is_settled: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface ActualResult {
  id: number;
  question_id: number;
  answer: PredictionAnswer;
  settled_by: string | null;
  settled_at: string;
}

// ============================================================
// Leaderboard types
// ============================================================

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  name: string;
  total_points: number;
  is_current_user?: boolean;
}

// ============================================================
// Question status (derived, not stored)
// ============================================================

export type QuestionStatus = 'open' | 'locked' | 'settled';

export function getQuestionStatus(question: Question): QuestionStatus {
  if (question.is_settled) return 'settled';
  if (new Date(question.lock_date) <= new Date()) return 'locked';
  return 'open';
}

// ============================================================
// API request/response types
// ============================================================

export interface PredictionSubmitRequest {
  question_id: number;
  answer: PredictionAnswer;
}

export interface PredictionSubmitResponse {
  success: boolean;
  message: string;
  prediction?: Prediction;
}

export interface SettleRequest {
  question_id: number;
  actual_answer: PredictionAnswer;
}

export interface UpdateLockDateRequest {
  question_id: number;
  lock_date: string; // ISO timestamp
}
