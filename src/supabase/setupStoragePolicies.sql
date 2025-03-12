-- SQL script to set up proper RLS policies for Supabase storage buckets

-- This script should be run in the Supabase SQL Editor
-- It creates policies that allow authenticated users to perform operations on the media bucket

-- Policy for allowing authenticated users to upload files to the media bucket
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- Policy for allowing authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'media' AND auth.uid() = owner) 
WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

-- Policy for allowing authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'media' AND auth.uid() = owner);

-- Policy for allowing public access to read files in the media bucket
CREATE POLICY "Allow public access to media files" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'media');

-- Note: These policies need to be executed in the Supabase SQL Editor
-- To access the SQL Editor:
-- 1. Go to https://app.supabase.io
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Paste this script and run it