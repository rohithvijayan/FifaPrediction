-- ⚽ Migration: Add Favourite Team field and Registration Stats View
-- Run this in your Supabase SQL Editor

-- 1. Add favourite_team column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS favourite_team TEXT REFERENCES public.teams(code) ON DELETE SET NULL;

-- 2. Update user creation trigger function to copy favourite_team from auth metadata
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

-- 3. Create view to aggregate registration counts per team
CREATE OR REPLACE VIEW public.team_registration_counts WITH (security_invoker = true) AS
SELECT 
  t.code AS team_code,
  t.name AS team_name,
  t.flag_emoji,
  COUNT(u.uid) AS registration_count
FROM public.teams t
JOIN public.users u ON u.favourite_team = t.code
GROUP BY t.code, t.name, t.flag_emoji;
