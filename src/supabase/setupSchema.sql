-- SQL script to set up the database schema for the Gamify application

-- Create the playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  type TEXT NOT NULL,
  tracks JSONB DEFAULT '[]'::jsonb,
  userid uuid REFERENCES auth.users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  composer TEXT,
  duration TEXT,
  audioUrl TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policies for playlists
CREATE POLICY "Users can view all playlists"
  ON public.playlists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own playlists"
  ON public.playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);

-- Create policies for songs
CREATE POLICY "Anyone can view songs"
  ON public.songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create songs"
  ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: This script needs to be executed in the Supabase SQL Editor
-- To access the SQL Editor:
-- 1. Go to https://app.supabase.io
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Paste this script and run it