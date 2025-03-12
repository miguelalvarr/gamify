import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Snackbar, Alert, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePlaylists } from '../context/PlaylistContext';

// List of popular games for the dropdown
const popularGames = [
  'Final Fantasy',
  'The Legend of Zelda',
  'Super Mario Bros',
  'Chrono Trigger',
  'Skyrim',
  'Halo',
  'Minecraft',
  'Sonic the Hedgehog',
  'Pokemon',
  'Metal Gear Solid',
  'Castlevania',
  'Mega Man',
  'Kingdom Hearts',
  'Resident Evil',
  'Otros'
];

function AdminPanel() {
  const { playlists, addSong, createPlaylist, handlePlaylistImage, handleAudioFile } = usePlaylists();
  
  // State for song form
  const [songForm, setSongForm] = useState({
    title: '',
    game: '',
    composer: '',
    duration: '',
    playlist: '',
    generalPlaylist: '',
    audioFile: null
  });

  // State for playlist form
  const [playlistForm, setPlaylistForm] = useState({
    title: '',
    description: '',
    image: null,
    type: 'general',
    game: ''
  });
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  // Handle song form changes
  const handleSongChange = (e) => {
    const { name, value } = e.target;
    setSongForm(prev => ({ ...prev, [name]: value }));
  };
  // Handle song file upload
  const handleSongFileChange = (e) => {
    if (e.target.files[0]) {
      setSongForm(prev => ({ ...prev, audioFile: e.target.files[0] }));
    }
  };
  // Handle playlist form changes
  const handlePlaylistChange = (e) => {
    const { name, value } = e.target;
    setPlaylistForm(prev => ({ ...prev, [name]: value }));
  };
  // Handle playlist image upload
  const handlePlaylistImageChange = (e) => {
    if (e.target.files[0]) {
      setPlaylistForm(prev => ({ ...prev, image: e.target.files[0] }));
    }
  };
  // Submit song form
  const handleSongSubmit = async (e) => {
    e.preventDefault();
    
    // Convert audio file to base64 string for persistent storage
    let audioUrl = '';
    if (songForm.audioFile) {
      try {
        // Use the handleAudioFile function from context to convert to base64
        audioUrl = await handleAudioFile(songForm.audioFile);
      } catch (error) {
        console.error('Error processing audio file:', error);
        setNotification({
          open: true,
          message: 'Error al procesar el archivo de audio',
          severity: 'error'
        });
        return;
      }
    }
    
    // Create the new song object
    const newSong = {
      title: songForm.title,
      game: playlists[songForm.playlist]?.title || '',
      composer: songForm.composer,
      duration: songForm.duration,
      audiourl: audioUrl // Add the base64 audio data to the song object
    };
    
    // Add the song to the selected playlist and optionally to a general playlist
    addSong(songForm.playlist, newSong, songForm.generalPlaylist || null);
    
    // Show success notification
    setNotification({
      open: true,
      message: `Canción "${songForm.title}" añadida correctamente`,
      severity: 'success'
    });
    
    // Reset form
    setSongForm({
      title: '',
      game: '',
      composer: '',
      duration: '',
      playlist: '',
      generalPlaylist: '',
      audioFile: null
    });
  };
  // Submit playlist form
  const handlePlaylistSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert image to base64 string for persistent storage
      const imageData = await handlePlaylistImage(playlistForm.image);
      
      // Create the new playlist
      const newPlaylist = {
        title: playlistForm.title,
        description: playlistForm.description,
        image: imageData,
        type: playlistForm.type,
        tracks: []
      };
      
      // Add the playlist to the context
      await createPlaylist(newPlaylist);
      
      // Show success notification
      setNotification({
        open: true,
        message: `Playlist "${playlistForm.title}" creada correctamente`,
        severity: 'success'
      });
      
      // Reset form
      setPlaylistForm({
        title: '',
        description: '',
        image: null,
        type: 'general',
        game: ''
      });
    } catch (error) {
      console.error('Error processing playlist:', error);
      setNotification({
        open: true,
        message: 'Error al crear la playlist: ' + error.message,
        severity: 'error'
      });
    }
  };
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Panel de Administración
      </Typography>
      <Grid container spacing={4}>
        {/* Add Song Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Añadir Nueva Canción
            </Typography>
            
            <form onSubmit={handleSongSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título de la canción"
                    name="title"
                    value={songForm.title}
                    onChange={handleSongChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Playlist de Videojuego</InputLabel>
                    <Select
                      name="playlist"
                      value={songForm.playlist}
                      onChange={handleSongChange}
                      label="Playlist de Videojuego"
                    >
                      {Object.values(playlists)
                        .filter(playlist => playlist.type === 'game')
                        .map(playlist => (
                          <MenuItem key={playlist.id} value={playlist.id}>
                            {playlist.title}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Compositor"
                    name="composer"
                    value={songForm.composer}
                    onChange={handleSongChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duración (ej: 3:45)"
                    name="duration"
                    value={songForm.duration}
                    onChange={handleSongChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Playlist General (Opcional)</InputLabel>
                    <Select
                      name="generalPlaylist"
                      value={songForm.generalPlaylist || ''}
                      onChange={handleSongChange}
                      label="Playlist General (Opcional)"
                    >
                      <MenuItem value=""><em>Ninguna</em></MenuItem>
                      {Object.values(playlists)
                        .filter(playlist => playlist.type === 'general')
                        .map(playlist => (
                          <MenuItem key={playlist.id} value={playlist.id}>
                            {playlist.title}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {songForm.audioFile ? songForm.audioFile.name : 'Subir archivo de audio (.mp3)'}
                    <input
                      type="file"
                      accept="audio/mp3"
                      hidden
                      onChange={handleSongFileChange}
                      required
                    />
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    startIcon={<AddIcon />}
                    sx={{ py: 1.5, mt: 1 }}
                    disabled={!songForm.audioFile || !songForm.title || !songForm.playlist}
                  >
                    Añadir Canción
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        {/* Add Playlist Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Crear Nueva Playlist
            </Typography>
            
            <form onSubmit={handlePlaylistSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título de la playlist"
                    name="title"
                    value={playlistForm.title}
                    onChange={handlePlaylistChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Playlist</InputLabel>
                    <Select
                      name="type"
                      value={playlistForm.type}
                      onChange={handlePlaylistChange}
                      label="Tipo de Playlist"
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="game">Videojuego</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Game field removed as requested - creating a game playlist is already adding a new game */}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="description"
                    value={playlistForm.description}
                    onChange={handlePlaylistChange}
                    multiline
                    rows={3}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {playlistForm.image ? playlistForm.image.name : 'Subir imagen de portada'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePlaylistImageChange}
                      required
                    />
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    startIcon={<AddIcon />}
                    sx={{ py: 1.5, mt: 1 }}
                    disabled={!playlistForm.image || !playlistForm.title}
                  >
                    Crear Playlist
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
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

export default AdminPanel;