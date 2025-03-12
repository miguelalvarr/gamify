// Supabase service for handling playlists and songs
import { supabase } from './config';

// Fetch all playlists for a user
export const fetchPlaylists = async (userid) => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('userid', userid);
    
    if (error) throw error;
    
    // Convert array to object with id as key for compatibility with existing code
    const playlists = {};
    data.forEach((playlist) => {
      playlists[playlist.id] = playlist;
    });
    
    return playlists;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};

// Optimización: Fetch playlists by type
export const fetchPlaylistsByType = async (userid, type) => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('userid', userid)
      .eq('type', type);
    
    if (error) throw error;
    
    // Convert array to object with id as key for compatibility with existing code
    const playlists = {};
    data.forEach((playlist) => {
      playlists[playlist.id] = playlist;
    });
    
    return playlists;
  } catch (error) {
    console.error(`Error fetching ${type} playlists:`, error);
    throw error;
  }
};

// Create a new playlist
export const createPlaylist = async (userid, playlist) => {
  try {
    const newPlaylist = {
      ...playlist,
      userid,
      tracks: [],
      "createdat": new Date(),
      "updatedat": new Date()
    };
    
    const { data, error } = await supabase
      .from('playlists')
      .insert([newPlaylist])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

// Update a playlist
export const updatePlaylist = async (playlistId, playlistData) => {
  try {
    const { error } = await supabase
      .from('playlists')
      .update({
        ...playlistData,
        updatedat: new Date()
      })
      .eq('id', playlistId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Delete a playlist
export const deletePlaylist = async (playlistId) => {
  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

// Add a song to a playlist
export const addSongToPlaylist = async (playlistId, song) => {
  try {
    // First, add the song to the songs table if it doesn't exist
    const { data: existingSong, error: songCheckError } = await supabase
      .from('songs')
      .select('*')
      .eq('title', song.title)
      .eq('game', song.game)
      .single();
    
    if (songCheckError && songCheckError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw songCheckError;
    }
    
    let songId;
    
    if (!existingSong) {
      // Song doesn't exist, create it
      const { data: newSong, error: createSongError } = await supabase
        .from('songs')
        .insert([song])
        .select();
      
      if (createSongError) throw createSongError;
      songId = newSong[0].id;
    } else {
      songId = existingSong.id;
    }
    
    // Get the current playlist to update its tracks
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();
    
    if (playlistError) throw playlistError;
    
    // Add the song to the playlist's tracks
    const trackToAdd = {
      id: songId,
      title: song.title,
      game: song.game,
      composer: song.composer,
      duration: song.duration,
      audiourl: song.audiourl
    };
    
    const updatedTracks = [...(playlist.tracks || []), trackToAdd];
    
    // Update the playlist with the new tracks
    const { error: updateError } = await supabase
      .from('playlists')
      .update({
        tracks: updatedTracks,
        updatedat: new Date()
      })
      .eq('id', playlistId);
    
    if (updateError) throw updateError;
    
    return trackToAdd;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

// Remove a song from a playlist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    // Get the current playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();
    
    if (playlistError) throw playlistError;
    
    // Filter out the song to remove
    const updatedTracks = (playlist.tracks || []).filter(track => track.id !== songId);
    
    // Update the playlist with the filtered tracks
    const { error: updateError } = await supabase
      .from('playlists')
      .update({
        tracks: updatedTracks,
        updatedat: new Date()
      })
      .eq('id', playlistId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw error;
  }
};

// Upload playlist image (returns URL)
export const handlePlaylistImage = async (file) => {
  if (!file) return '';
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `playlist-images/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('media')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data } = supabase
      .storage
      .from('media')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading playlist image:', error);
    throw error;
  }
};

// Handle audio file uploads
export const handleAudioFile = async (file) => {
  if (!file) return '';
  
  // Check file size - limit to 5MB to prevent memory issues
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return Promise.reject(new Error('El archivo de audio es demasiado grande. El tamaño máximo es 5MB.'));
  }
  
  try {
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error('User must be authenticated to upload files');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `audio-files/${fileName}`;
    
    // Create the bucket if it doesn't exist and set public policy
    const { error: bucketError } = await supabase
      .storage
      .createBucket('media', {
        public: true,
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3'],
        fileSizeLimit: maxSizeInBytes
      })
      .catch(() => ({ error: null })); // Ignore error if bucket already exists

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file: ' + uploadError.message);
    }
    
    // Get the public URL
    const { data } = supabase
      .storage
      .from('media')
      .getPublicUrl(filePath);
    
    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
};

// Initialize with default playlists if user has none
export const initializeDefaultPlaylists = async (userid) => {
  try {
    // Check if user has any playlists
    const { data, error } = await supabase
      .from('playlists')
      .select('id')
      .eq('userid', userid);
    
    if (error) throw error;
    
    // If user has no playlists, create default ones
    if (data.length === 0) {
      const defaultPlaylists = [
        {
          title: 'Persona 3 RELOAD',
          description: 'Persona 3 Reload nos pone en el papel de un estudiante que se traslada en su segundo año al instituto de Gekkoukan en la isla de Tatsumi. Pronto descubre que en este lugar sucede un fenómeno sobrenatural conocido como la Hora Oscura; una 25ª hora del día que solo unos pocos experimentan mientras el resto del mundo descansa en una especie de ataúdes.',
          image: 'https://images.genius.com/f987919fa49ef5297b311f4aa702a6b1.1000x1000x1.png',
          type: 'game',
          tracks: [
            { title: 'To Zanarkand', game: 'Final Fantasy X', composer: 'Nobuo Uematsu', duration: '3:54' },
            { title: 'Corridors of Time', game: 'Chrono Trigger', composer: 'Yasunori Mitsuda', duration: '3:12' },
            { title: 'Song of Storms', game: 'The Legend of Zelda: Ocarina of Time', composer: 'Koji Kondo', duration: '2:37' },
            { title: 'Aeriths Theme', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:05' },
            { title: 'Dearly Beloved', game: 'Kingdom Hearts', composer: 'Yoko Shimomura', duration: '3:28' },
            { title: 'Main Theme', game: 'Skyrim', composer: 'Jeremy Soule', duration: '4:33' },
          ]
        },
        {
          title: 'Música de Acción',
          description: 'Temas intensos para momentos de acción',
          image: 'https://placehold.co/300x300/c0392b/FFFFFF/png?text=Action',
          type: 'general',
          tracks: [
            { title: 'One-Winged Angel', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:36' },
            { title: 'Battle Theme', game: 'Pokemon', composer: 'Junichi Masuda', duration: '2:45' },
            { title: 'E1M1', game: 'DOOM', composer: 'Bobby Prince', duration: '1:43' },
            { title: 'Megalovania', game: 'Undertale', composer: 'Toby Fox', duration: '3:29' },
            { title: 'Rules of Nature', game: 'Metal Gear Rising', composer: 'Jamie Christopherson', duration: '3:54' },
          ]
        }
      ];
      
      for (const playlist of defaultPlaylists) {
        await createPlaylist(userid, playlist);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing default playlists:', error);
    throw error;
  }
};

// Favorites system - Playlists
export const addPlaylistToFavorites = async (userId, playlistId) => {
  try {
    const { error } = await supabase
      .from('favorite_playlists')
      .insert([{ user_id: userId, playlist_id: playlistId }]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding playlist to favorites:', error);
    throw error;
  }
};

export const removePlaylistFromFavorites = async (userId, playlistId) => {
  try {
    const { error } = await supabase
      .from('favorite_playlists')
      .delete()
      .eq('user_id', userId)
      .eq('playlist_id', playlistId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing playlist from favorites:', error);
    throw error;
  }
};

export const getFavoritePlaylistsIds = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('favorite_playlists')
      .select('playlist_id')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data.map(item => item.playlist_id);
  } catch (error) {
    console.error('Error fetching favorite playlists IDs:', error);
    return [];
  }
};

export const getFavoritePlaylists = async (userId) => {
  try {
    // Get favorite playlist IDs
    const favIds = await getFavoritePlaylistsIds(userId);
    
    if (favIds.length === 0) return {};
    
    // Fetch the actual playlists
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .in('id', favIds);
      
    if (error) throw error;
    
    // Convert array to object with id as key
    const playlists = {};
    data.forEach((playlist) => {
      playlists[playlist.id] = playlist;
    });
    
    return playlists;
  } catch (error) {
    console.error('Error fetching favorite playlists:', error);
    return {};
  }
};

// Favorites system - Songs
export const addSongToFavorites = async (userId, songId) => {
  try {
    const { error } = await supabase
      .from('favorite_songs')
      .insert([{ user_id: userId, song_id: songId }]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding song to favorites:', error);
    throw error;
  }
};

export const removeSongFromFavorites = async (userId, songId) => {
  try {
    const { error } = await supabase
      .from('favorite_songs')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing song from favorites:', error);
    throw error;
  }
};

export const getFavoriteSongIds = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('favorite_songs')
      .select('song_id')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data.map(item => item.song_id);
  } catch (error) {
    console.error('Error fetching favorite song IDs:', error);
    return [];
  }
};

export const getFavoriteSongs = async (userId) => {
  try {
    // Get favorite song IDs
    const favIds = await getFavoriteSongIds(userId);
    
    if (favIds.length === 0) return [];
    
    // Fetch the actual songs
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .in('id', favIds);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching favorite songs:', error);
    return [];
  }
};

// Check if playlist is favorite
export const isPlaylistFavorite = async (userId, playlistId) => {
  try {
    const { data, error, count } = await supabase
      .from('favorite_playlists')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('playlist_id', playlistId);
      
    if (error) throw error;
    return count > 0;
  } catch (error) {
    console.error('Error checking if playlist is favorite:', error);
    return false;
  }
};

// Check if song is favorite
export const isSongFavorite = async (userId, songId) => {
  try {
    const { data, error, count } = await supabase
      .from('favorite_songs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('song_id', songId);
      
    if (error) throw error;
    return count > 0;
  } catch (error) {
    console.error('Error checking if song is favorite:', error);
    return false;
  }
};