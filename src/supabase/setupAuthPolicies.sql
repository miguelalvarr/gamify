-- SQL script to set up proper RLS policies for Supabase authentication

-- This script should be run in the Supabase SQL Editor
-- It creates policies that allow proper user registration and authentication

-- Enable Row Level Security on auth schema tables if not already enabled
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Policy for allowing the service role to manage users
CREATE POLICY "Service role can manage users"
  ON auth.users
  FOR ALL
  TO service_role
  USING (true);

-- Policy for allowing users to read their own data
CREATE POLICY "Users can read their own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for allowing users to update their own data
CREATE POLICY "Users can update their own data"
  ON auth.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the auth.users table has the correct permissions
GRANT SELECT, INSERT, UPDATE ON auth.users TO service_role, postgres;
GRANT SELECT ON auth.users TO authenticated;

-- Ensure the auth schema has the correct permissions
GRANT USAGE ON SCHEMA auth TO service_role, postgres, authenticated;

-- Ensure the auth.users_id_seq sequence has the correct permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON SEQUENCE auth.users_id_seq TO service_role, postgres;

-- Note: These policies need to be executed in the Supabase SQL Editor
-- To access the SQL Editor:
-- 1. Go to https://app.supabase.io
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Paste this script and run it

-- Important: After running these policies, you may need to restart the Supabase Auth service
-- or wait a few minutes for the changes to take effect.