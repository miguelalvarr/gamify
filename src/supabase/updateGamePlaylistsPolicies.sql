-- SQL script to update security policies for game playlists to make them publicly visible

-- Drop existing playlist visibility policies for game playlists
DROP POLICY IF EXISTS "Users can view all playlists" ON public.playlists;

-- Create new policy to allow public access to game playlists (no authentication required)
CREATE POLICY "Game playlists are publicly visible"
  ON public.playlists
  FOR SELECT
  USING (type = 'game');

-- Create policy to allow authenticated users to view all playlists (including general playlists)
CREATE POLICY "Authenticated users can view all playlists"
  ON public.playlists
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: This script needs to be executed in the Supabase SQL Editor
-- 1. Go to https://app.supabase.io
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Paste this script and run it
-- 5. Verify that the policies have been updated correctly in the Auth > Policies section