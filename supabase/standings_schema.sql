-- ⚽ group_standings Table
-- Run this in your Supabase SQL Editor to support group standings data!

CREATE TABLE IF NOT EXISTS public.group_standings (
  id SERIAL PRIMARY KEY,
  group_name TEXT NOT NULL, -- e.g. 'Group A'
  team_name TEXT NOT NULL,  -- e.g. 'Argentina'
  team_code TEXT NOT NULL UNIQUE,  -- e.g. 'ARG' (used as unique key for upsert)
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_standings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view standings
CREATE POLICY "Allow public read access to group_standings"
ON public.group_standings FOR SELECT
USING (true);

-- Allow service role / admin to insert or update standings
CREATE POLICY "Allow admin / service role full access"
ON public.group_standings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index on group_name and points
CREATE INDEX IF NOT EXISTS idx_standings_group_name ON public.group_standings(group_name);
CREATE INDEX IF NOT EXISTS idx_standings_points ON public.group_standings(points DESC);
