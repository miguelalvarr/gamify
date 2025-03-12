-- SQL script to update security policies for songs to make them publicly visible

-- Drop existing song visibility policy
DROP POLICY IF EXISTS "Anyone can view songs" ON public.songs;

-- Create new policy to allow public access to songs (no authentication required)
CREATE POLICY "Songs are publicly visible"
  ON public.songs
  FOR SELECT
  USING (true);

-- Note: This script needs to be executed in the Supabase SQL Editor
-- 1. Go to https://app.supabase.io
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Paste this script and run it
-- 5. Verify that the policies have been updated correctly in the Auth > Policies section