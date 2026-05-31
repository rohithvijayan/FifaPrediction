// Pure scoring logic — settleFixture()
// No side effects. Takes fixture + predictions, returns scored predictions.

import { Fixture, Prediction, PredictionResult } from './types';

export const POINTS_PER_CORRECT = 10;

export interface ScoredPrediction {
  prediction_id: string; // uid_fixtureId
  user_id: string;
  fixture_id: number;
  predicted_result: PredictionResult;
  actual_result: PredictionResult;
  is_correct: boolean;
  points_earned: number;
}

/**
 * settleFixture — pure function, no Firestore calls.
 *
 * Given a completed fixture and all predictions for it,
 * returns an array of ScoredPrediction results.
 *
 * Throws if fixture.result is null (not yet settled).
 */
export function settleFixture(
  fixture: Fixture,
  predictions: (Prediction & { _id: string })[]
): ScoredPrediction[] {
  if (!fixture.result) {
    throw new Error(
      `Cannot settle fixture ${fixture.fixture_id} — result is null (status: ${fixture.status})`
    );
  }

  return predictions.map((pred) => {
    const is_correct = pred.predicted_result === fixture.result;
    return {
      prediction_id: pred._id,
      user_id: pred.user_id,
      fixture_id: fixture.fixture_id,
      predicted_result: pred.predicted_result,
      actual_result: fixture.result!,
      is_correct,
      points_earned: is_correct ? POINTS_PER_CORRECT : 0,
    };
  });
}
