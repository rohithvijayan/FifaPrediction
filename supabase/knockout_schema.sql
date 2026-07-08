-- ⚽ knockout_stage_results Table
-- Run this in your Supabase SQL Editor to support knockout stage results data!

CREATE TABLE IF NOT EXISTS public.knockout_stage_results (
  id SERIAL PRIMARY KEY,
  match_number TEXT NOT NULL UNIQUE,       -- e.g. "73", "74", "89", etc.
  stage TEXT NOT NULL,                     -- e.g. 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third-Place Play-Off', 'Final'
  match_date TEXT,                         -- e.g. '2026-06-29'
  match_time TEXT,                         -- e.g. '12:30 AM'
  fixture TEXT NOT NULL,                   -- e.g. 'South Africa vs Canada'
  home_team TEXT NOT NULL,                 -- e.g. 'South Africa'
  home_team_code TEXT,                     -- e.g. 'RSA'
  away_team TEXT NOT NULL,                 -- e.g. 'Canada'
  away_team_code TEXT,                     -- e.g. 'CAN'
  home_score INTEGER,                      -- e.g. 0
  away_score INTEGER,                      -- e.g. 1
  home_penalty_score INTEGER,              -- e.g. 4 (if penalty shootout)
  away_penalty_score INTEGER,              -- e.g. 2 (if penalty shootout)
  status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Upcoming', 'LIVE', 'FT'
  venue TEXT,                              -- e.g. 'Los Angeles Stadium'
  result_text TEXT,                        -- e.g. 'South Africa 0 – 1 Canada'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.knockout_stage_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view knockout results
DROP POLICY IF EXISTS "Allow public read access to knockout_stage_results" ON public.knockout_stage_results;
CREATE POLICY "Allow public read access to knockout_stage_results"
ON public.knockout_stage_results FOR SELECT
USING (true);

-- Allow service role / admin to insert or update knockout results
DROP POLICY IF EXISTS "Allow admin / service role full access" ON public.knockout_stage_results;
CREATE POLICY "Allow admin / service role full access"
ON public.knockout_stage_results FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index on stage
CREATE INDEX IF NOT EXISTS idx_knockout_stage ON public.knockout_stage_results(stage);
