-- SQL script to update security policies for songs and playlists

-- Drop existing playlist visibility policy
DROP POLICY IF EXISTS "Users can view their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can view all playlists" ON public.playlists;

-- Create new policy to allow all authenticated users to view all playlists
CREATE POLICY "Users can view all playlists"
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