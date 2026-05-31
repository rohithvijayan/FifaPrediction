-- Goal Guru — Database Schema & Setup Script
-- Paste this script into your Supabase SQL Editor.

-- 1. Create users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view profiles (needed for global leaderboard)
CREATE POLICY "Allow public read-only access to profiles" 
ON public.users FOR SELECT 
USING (true);

-- Update policy: Allow users to only modify their own profile details
CREATE POLICY "Allow users to update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = uid);


-- 2. Create fixtures table
CREATE TABLE IF NOT EXISTS public.fixtures (
  fixture_id INTEGER PRIMARY KEY,
  match_date DATE NOT NULL,
  kickoff_utc TIMESTAMPTZ NOT NULL,
  kickoff_ist TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'NS',
  result TEXT, -- 'H', 'D', 'A', or NULL
  _seeded_at TIMESTAMPTZ DEFAULT NOW(),
  _live_polled_at TIMESTAMPTZ,
  _settled_at TIMESTAMPTZ
);

-- Enable RLS on fixtures
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone can read fixture list
CREATE POLICY "Allow public read access to fixtures" 
ON public.fixtures FOR SELECT 
USING (true);


-- 3. Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  fixture_id INTEGER REFERENCES public.fixtures(fixture_id) ON DELETE CASCADE,
  predicted_result TEXT NOT NULL CHECK (predicted_result IN ('H', 'D', 'A')),
  editable BOOLEAN DEFAULT TRUE,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, fixture_id)
);

-- Enable RLS on predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Select policy: A user can only see their own predictions
CREATE POLICY "Allow users to read own predictions" 
ON public.predictions FOR SELECT 
USING (auth.uid() = user_id);

-- Insert policy: A user can only create their own predictions
CREATE POLICY "Allow users to upsert own predictions" 
ON public.predictions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update policy: A user can only update their own predictions
CREATE POLICY "Allow users to update own predictions" 
ON public.predictions FOR UPDATE 
USING (auth.uid() = user_id);


-- 4. Trigger Function: Automatically create a public.users profile row upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, name, email, total_points, correct_predictions, is_admin, registered_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Player'),
    new.email,
    0,
    0,
    FALSE,
    new.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. RPC Function: Settle finished match predictions & increment user scores atomically
CREATE OR REPLACE FUNCTION public.settle_fixture_predictions(target_fixture_id INT, actual_result TEXT)
RETURNS VOID AS $$
BEGIN
  -- A. Update all prediction rows for this fixture
  WITH updated_preds AS (
    UPDATE public.predictions
    SET
      is_correct = (predicted_result = actual_result),
      points_earned = CASE WHEN predicted_result = actual_result THEN 10 ELSE 0 END,
      editable = false
    WHERE fixture_id = target_fixture_id
    RETURNING user_id, points_earned, is_correct
  )
  -- B. Atomically increment points/correct counts for all corresponding users
  UPDATE public.users u
  SET
    total_points = u.total_points + up.points_earned,
    correct_predictions = u.correct_predictions + CASE WHEN up.is_correct THEN 1 ELSE 0 END
  FROM updated_preds up
  WHERE u.uid = up.user_id;

  -- C. Mark fixture as settled
  UPDATE public.fixtures
  SET _settled_at = NOW()
  WHERE fixture_id = target_fixture_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
