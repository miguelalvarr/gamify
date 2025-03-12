import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, IconButton, Divider, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAudio } from '../context/AudioContext';
import { usePlaylists } from '../context/PlaylistContext';
import { supabase } from '../supabase/config';

function AllSongs() {
  const { play, isPlaying, currentTrack } = useAudio();
  const { playlists, user } = usePlaylists();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch all songs from the database
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('title', { ascending: true });
        
        if (error) throw error;
        setSongs(data || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
        setNotification({
          open: true,
          message: 'Error al cargar las canciones',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Handle opening the playlist menu
  const handleOpenMenu = (event, song) => {
    if (!user) {
      // If user is not logged in, show notification
      setNotification({
        open: true,
        message: 'Inicia sesión para añadir canciones a tus playlists',
        severity: 'info'
      });
      return;
    }
    setAnchorEl(event.currentTarget);
    setSelectedSong(song);
  };

  // Handle closing the playlist menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Get general playlists for the current user
  const generalPlaylists = user ? Object.values(playlists).filter(
    playlist => playlist.type === 'general' && playlist.userid === user?.id
  ) : [];

  // Add song to a playlist
  const addSongToPlaylist = async (playlistId) => {
    try {
      // Get the playlist
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      
      if (playlistError) throw playlistError;
      
      // Check if song already exists in the playlist
      const songExists = (playlist.tracks || []).some(track => track.id === selectedSong.id);
      
      if (songExists) {
        setNotification({
          open: true,
          message: 'Esta canción ya existe en la playlist',
          severity: 'warning'
        });
        handleCloseMenu();
        return;
      }
      
      // Add the song to the playlist's tracks
      const trackToAdd = {
        id: selectedSong.id,
        title: selectedSong.title,
        game: selectedSong.game,
        composer: selectedSong.composer,
        duration: selectedSong.duration,
        audiourl: selectedSong.audiourl
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
      
      setNotification({
        open: true,
        message: 'Canción añadida a la playlist correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      setNotification({
        open: true,
        message: 'Error al añadir la canción a la playlist',
        severity: 'error'
      });
    } finally {
      handleCloseMenu();
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Todas las Canciones
      </Typography>

      {loading ? (
        <Typography>Cargando canciones...</Typography>
      ) : songs.length === 0 ? (
        <Typography>No hay canciones disponibles.</Typography>
      ) : (
        <Paper sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
          {/* List Header */}
          <Box sx={{ display: 'flex', px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ width: 50, color: 'grey.500' }}>#</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ flex: 1, color: 'grey.500' }}>TÍTULO</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ width: 200, color: 'grey.500' }}>JUEGO</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ width: 200, color: 'grey.500' }}>COMPOSITOR</Typography>
            <Box sx={{ width: 100, display: 'flex', justifyContent: 'flex-end' }}>
              <AccessTimeIcon sx={{ color: 'grey.500', fontSize: 20 }} />
            </Box>
          </Box>

          {/* Song Items */}
          <List sx={{ py: 0 }}>
            {songs.map((song, index) => (
              <React.Fragment key={song.id}>
                <ListItem 
                  onClick={() => play(song)}
                  sx={{ 
                    px: 2, 
                    cursor: 'pointer',
                    bgcolor: currentTrack?.id === song.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .playButton': { opacity: 1 },
                      '& .addButton': { opacity: 1 }
                    } 
                  }}
                >
                  <Box sx={{ width: 50, display: 'flex', alignItems: 'center' }}>
                    <Box 
                      className="playButton" 
                      sx={{ 
                        opacity: isPlaying && currentTrack?.id === song.id ? 1 : 0, 
                        mr: 1,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        play(song);
                      }}
                    >
                      <PlayArrowIcon sx={{ 
                        fontSize: 18, 
                        color: isPlaying && currentTrack?.id === song.id ? 'primary.main' : 'white' 
                      }} />
                    </Box>
                    <Typography color="text.secondary">{index + 1}</Typography>
                  </Box>
                  <ListItemText 
                    primary={song.title} 
                    sx={{ flex: 1 }}
                  />
                  <Typography sx={{ width: 200, color: 'text.secondary' }}>
                    {song.game}
                  </Typography>
                  <Typography sx={{ width: 200, color: 'text.secondary' }}>
                    {song.composer}
                  </Typography>
                  <Box sx={{ width: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">{song.duration}</Typography>
                    <IconButton 
                      className="addButton"
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMenu(e, song);
                      }}
                      sx={{ 
                        opacity: 0,
                        '&:hover': { color: 'primary.main' },
                        '.MuiListItem-root:hover &': { opacity: 1 }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < songs.length - 1 && <Divider component="li" sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Playlist Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Typography sx={{ px: 2, py: 1, fontWeight: 'bold' }}>Añadir a playlist</Typography>
        <Divider />
        {generalPlaylists.length === 0 ? (
          <MenuItem disabled>No tienes playlists generales</MenuItem>
        ) : (
          generalPlaylists.map(playlist => (
            <MenuItem key={playlist.id} onClick={() => addSongToPlaylist(playlist.id)}>
              {playlist.title}
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AllSongs;