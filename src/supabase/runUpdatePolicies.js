// Script to run the SQL scripts that update security policies for songs and game playlists
import { supabase } from './config';

// Function to run the SQL script to update song policies
export const updateSongsPolicies = async () => {
  try {
    // SQL script to update security policies for songs to make them publicly visible
    const sql = `
      -- Drop existing song visibility policy
      DROP POLICY IF EXISTS "Anyone can view songs" ON public.songs;
      
      -- Create new policy to allow public access to songs (no authentication required)
      CREATE POLICY "Songs are publicly visible"
        ON public.songs
        FOR SELECT
        USING (true);
    `;
    
    const { error } = await supabase.rpc('pgtle_admin.install_extension_version_sql', {
      sql_code: sql
    });
    
    if (error) throw error;
    
    console.log('Successfully updated song policies to make them publicly visible');
    return { success: true };
  } catch (error) {
    console.error('Error updating song policies:', error);
    return { success: false, error };
  }
};

// Function to run the SQL script to update game playlist policies
export const updateGamePlaylistsPolicies = async () => {
  try {
    // SQL script to update security policies for game playlists to make them publicly visible
    const sql = `
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
    `;
    
    const { error } = await supabase.rpc('pgtle_admin.install_extension_version_sql', {
      sql_code: sql
    });
    
    if (error) throw error;
    
    console.log('Successfully updated game playlist policies to make them publicly visible');
    return { success: true };
  } catch (error) {
    console.error('Error updating game playlist policies:', error);
    return { success: false, error };
  }
};

// Function to run both policy updates
export const updateAllPolicies = async () => {
  try {
    const songResult = await updateSongsPolicies();
    const playlistResult = await updateGamePlaylistsPolicies();
    
    if (!songResult.success || !playlistResult.success) {
      throw new Error('Failed to update all policies');
    }
    
    console.log('Successfully updated all policies');
    return { success: true };
  } catch (error) {
    console.error('Error updating policies:', error);
    return { success: false, error };
  }
};

// Run the updates if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('runUpdatePolicies')) {
  updateAllPolicies()
    .then(result => {
      if (result.success) {
        alert('Successfully updated all policies to make songs and game playlists publicly visible');
      } else {
        alert('Error updating policies. Check the console for details.');
      }
    });
}