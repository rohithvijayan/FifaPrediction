-- ⚽ golden_boot_standings Table
-- Run this in your Supabase SQL Editor to support golden boot standings data!

CREATE TABLE IF NOT EXISTS public.golden_boot_standings (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  team_code TEXT NOT NULL UNIQUE,  -- unique per player/team combo or player_name (we can use player_name as unique constraint)
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  position TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate constraint to be unique on player_name if needed, or unique on player_name to avoid duplicates
ALTER TABLE public.golden_boot_standings DROP CONSTRAINT IF EXISTS golden_boot_standings_player_name_key;
ALTER TABLE public.golden_boot_standings ADD CONSTRAINT golden_boot_standings_player_name_key UNIQUE (player_name);

-- Enable RLS
ALTER TABLE public.golden_boot_standings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view Golden Boot standings
DROP POLICY IF EXISTS "Allow public read access to golden_boot_standings" ON public.golden_boot_standings;
CREATE POLICY "Allow public read access to golden_boot_standings"
ON public.golden_boot_standings FOR SELECT
USING (true);

-- Allow service role / admin to insert or update Golden Boot standings
DROP POLICY IF EXISTS "Allow admin / service role full access" ON public.golden_boot_standings;
CREATE POLICY "Allow admin / service role full access"
ON public.golden_boot_standings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index on rank and goals
CREATE INDEX IF NOT EXISTS idx_golden_boot_rank ON public.golden_boot_standings(rank);
CREATE INDEX IF NOT EXISTS idx_golden_boot_goals ON public.golden_boot_standings(goals DESC);
