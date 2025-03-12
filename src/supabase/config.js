// Supabase configuration file
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqslequjbhzpqbdnftam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxc2xlcXVqYmh6cHFiZG5mdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0ODAwODksImV4cCI6MjA1NzA1NjA4OX0.XJdFpOHypg4XLpmaMKob6c036We2efTFdsdtLcPc86A';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };