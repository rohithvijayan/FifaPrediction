-- ⚽ പന്തഭ്രനിയ (Goal Guru) — Revamped Database Schema
-- 6-Question Prediction Game for FIFA World Cup 2026
-- Run this in your Supabase SQL Editor

-- Clean up existing tables to avoid "column does not exist" errors
DROP TABLE IF EXISTS public.actual_results CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- 1. USERS TABLE (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  favourite_team TEXT, -- Foreign key reference added after teams table is defined
  total_points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Allow users to update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = uid);

-- ============================================================
-- 2. TEAMS TABLE (48 FIFA WC 2026 teams)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  flag_emoji TEXT NOT NULL DEFAULT '🏳️',
  group_name TEXT NOT NULL
);

-- Add foreign key constraint to users table once teams table is created
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_favourite_team 
FOREIGN KEY (favourite_team) REFERENCES public.teams(code) ON DELETE SET NULL;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to teams"
ON public.teams FOR SELECT
USING (true);

-- ============================================================
-- 3. PLAYERS TABLE (notable players for Golden Boot/Glove)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  team_code TEXT NOT NULL REFERENCES public.teams(code),
  position TEXT NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
  is_goalkeeper BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to players"
ON public.players FOR SELECT
USING (true);

-- ============================================================
-- 4. QUESTIONS TABLE (the 6 prediction questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER NOT NULL UNIQUE CHECK (question_number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  description TEXT,
  max_points INTEGER NOT NULL,
  lock_date TIMESTAMPTZ NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to questions"
ON public.questions FOR SELECT
USING (true);

-- Admin-only update (lock dates, settlement)
CREATE POLICY "Allow admin to update questions"
ON public.questions FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid() AND is_admin = true)
);

-- ============================================================
-- 5. PREDICTIONS TABLE (user answers per question)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.questions(id),
  answer JSONB NOT NULL,
  -- Answer shapes:
  -- Q1: {"team": "Brazil"}
  -- Q2: {"team": "Argentina"}
  -- Q3: {"team": "France"}
  -- Q4: {"player": "Kylian Mbappé"}
  -- Q5: {"player": "Thibaut Courtois"}
  -- Q6: {"team1_score": 2, "team2_score": 1}
  points_earned INTEGER DEFAULT 0,
  is_settled BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own predictions"
ON public.predictions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own predictions"
ON public.predictions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own predictions"
ON public.predictions FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================
-- 6. ACTUAL RESULTS TABLE (admin enters real outcomes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actual_results (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL UNIQUE REFERENCES public.questions(id),
  answer JSONB NOT NULL,
  settled_by UUID REFERENCES public.users(uid),
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.actual_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to results"
ON public.actual_results FOR SELECT
USING (true);

CREATE POLICY "Allow admin to insert results"
ON public.actual_results FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid() AND is_admin = true)
);

CREATE POLICY "Allow admin to update results"
ON public.actual_results FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid() AND is_admin = true)
);

-- ============================================================
-- 7. TRIGGER: Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, name, email, favourite_team, total_points, is_admin, registered_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Player'),
    new.email,
    new.raw_user_meta_data->>'favourite_team',
    0,
    FALSE,
    new.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. RPC: Calculate points for a single prediction
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_question_points(
  q_number INTEGER,
  user_answer JSONB,
  actual_answer JSONB,
  max_pts INTEGER
) RETURNS INTEGER AS $$
DECLARE
  pts INTEGER := 0;
  matches INTEGER := 0;
  actual_teams TEXT[];
  user_team TEXT;
BEGIN
  CASE q_number
    -- Q1: World Cup Winner (all or nothing)
    WHEN 1 THEN
      IF LOWER(TRIM(user_answer->>'team')) = LOWER(TRIM(actual_answer->>'team')) THEN
        pts := max_pts;
      END IF;

    -- Q2: Runner-Up (all or nothing)
    WHEN 2 THEN
      IF LOWER(TRIM(user_answer->>'team')) = LOWER(TRIM(actual_answer->>'team')) THEN
        pts := max_pts;
      END IF;

    -- Q3: Third-Place Team (all or nothing)
    WHEN 3 THEN
      IF LOWER(TRIM(user_answer->>'team')) = LOWER(TRIM(actual_answer->>'team')) THEN
        pts := max_pts;
      END IF;

    -- Q4: Golden Boot (all or nothing)
    WHEN 4 THEN
      IF LOWER(TRIM(user_answer->>'player')) = LOWER(TRIM(actual_answer->>'player')) THEN
        pts := max_pts;
      END IF;

    -- Q5: Golden Glove (all or nothing)
    WHEN 5 THEN
      IF LOWER(TRIM(user_answer->>'player')) = LOWER(TRIM(actual_answer->>'player')) THEN
        pts := max_pts;
      END IF;

    -- Q6: Final Score (exact = 11, no partial points)
    WHEN 6 THEN
      DECLARE
        u_t1 TEXT := LOWER(TRIM(user_answer->>'team1'));
        u_t2 TEXT := LOWER(TRIM(user_answer->>'team2'));
        u_s1 INTEGER := (user_answer->>'team1_score')::INTEGER;
        u_s2 INTEGER := (user_answer->>'team2_score')::INTEGER;
        
        a_t1 TEXT := LOWER(TRIM(actual_answer->>'team1'));
        a_t2 TEXT := LOWER(TRIM(actual_answer->>'team2'));
        a_s1 INTEGER := (actual_answer->>'team1_score')::INTEGER;
        a_s2 INTEGER := (actual_answer->>'team2_score')::INTEGER;
      BEGIN
        IF u_t1 = a_t1 AND u_t2 = a_t2 AND u_s1 = a_s1 AND u_s2 = a_s2 THEN
          pts := max_pts; -- Exact teams in exact order with exact score
        END IF;
      END;

    ELSE
      pts := 0;
  END CASE;

  RETURN pts;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 9. RPC: Settle a question (admin calls this)
-- ============================================================
CREATE OR REPLACE FUNCTION public.settle_question(
  target_question_id INTEGER,
  actual_answer JSONB
) RETURNS VOID AS $$
DECLARE
  q RECORD;
  pred RECORD;
  earned INTEGER;
BEGIN
  -- Get question details
  SELECT * INTO q FROM public.questions WHERE id = target_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question % not found', target_question_id;
  END IF;

  -- If already settled, first reverse previous points
  IF q.is_settled THEN
    UPDATE public.users u
    SET total_points = u.total_points - p.points_earned
    FROM public.predictions p
    WHERE p.user_id = u.uid AND p.question_id = target_question_id AND p.points_earned > 0;

    -- Reset predictions
    UPDATE public.predictions
    SET points_earned = 0, is_settled = false
    WHERE question_id = target_question_id;
  END IF;

  -- Calculate and award points for each prediction
  FOR pred IN SELECT * FROM public.predictions WHERE question_id = target_question_id
  LOOP
    earned := public.calculate_question_points(q.question_number, pred.answer, actual_answer, q.max_points);

    UPDATE public.predictions
    SET points_earned = earned, is_settled = true, updated_at = NOW()
    WHERE id = pred.id;

    UPDATE public.users
    SET total_points = total_points + earned
    WHERE uid = pred.user_id;
  END LOOP;

  -- Save/update actual result
  INSERT INTO public.actual_results (question_id, answer, settled_at)
  VALUES (target_question_id, actual_answer, NOW())
  ON CONFLICT (question_id) DO UPDATE SET answer = actual_answer, settled_at = NOW();

  -- Mark question as settled
  UPDATE public.questions SET is_settled = true WHERE id = target_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_question_id ON public.predictions(question_id);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_players_team_code ON public.players(team_code);
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);

-- ============================================================
-- 11. TRIGGER: Enforce Lock Date on predictions
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
  q_lock_date TIMESTAMPTZ;
BEGIN
  -- Get lock date of the question
  SELECT lock_date INTO q_lock_date FROM public.questions WHERE id = NEW.question_id;
  
  -- If lock date has passed, reject the insert/update
  IF NOW() > q_lock_date THEN
    RAISE EXCEPTION 'Prediction is locked for this question. Lock date was %', q_lock_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_prediction_lock ON public.predictions;
CREATE TRIGGER enforce_prediction_lock
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.check_prediction_lock();

-- ============================================================
-- 12. VIEW: Team registration counts for popular teams section
-- ============================================================
CREATE OR REPLACE VIEW public.team_registration_counts WITH (security_invoker = true) AS
SELECT 
  t.code AS team_code,
  t.name AS team_name,
  t.flag_emoji,
  COUNT(u.uid) AS registration_count
FROM public.teams t
JOIN public.users u ON u.favourite_team = t.code
GROUP BY t.code, t.name, t.flag_emoji;
