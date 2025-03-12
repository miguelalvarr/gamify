import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { usePlaylists } from '../context/PlaylistContext';
import { useAuth } from '../context/AuthContext';

function AddToPlaylistDialog({ open, onClose, song, currentPlaylistId }) {
  const { playlists, loading, addSong } = usePlaylists();
  const { user } = useAuth();
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filter playlists to only show user's general playlists (not including current playlist)
  useEffect(() => {
    if (playlists && Object.keys(playlists).length > 0 && user) {
      const filteredPlaylists = Object.values(playlists).filter(playlist => 
        playlist.userid === user.id && 
        playlist.type === 'general' && 
        playlist.id !== currentPlaylistId
      );
      setUserPlaylists(filteredPlaylists);
    }
  }, [playlists, user, currentPlaylistId]);

  const handleSelectPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await addSong(selectedPlaylistId, song);
      setSuccess(`Canción añadida a la playlist correctamente`);
      
      // Reset and close after a short delay
      setTimeout(() => {
        onClose();
        setSelectedPlaylistId(null);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(`Error al añadir la canción: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Añadir a playlist</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Selecciona una playlist para añadir "{song?.title}"
        </Typography>
        
        {loading ? (
          <CircularProgress />
        ) : userPlaylists.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tienes playlists disponibles. Crea una nueva playlist primero.
          </Typography>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {userPlaylists.map((playlist) => (
              <ListItem 
                key={playlist.id} 
                button 
                selected={selectedPlaylistId === playlist.id}
                onClick={() => handleSelectPlaylist(playlist.id)}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={playlist.image} 
                    alt={playlist.title}
                    variant="rounded"
                  >
                    {playlist.title.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={playlist.title} 
                  secondary={`${playlist.tracks?.length || 0} canciones`} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleAddToPlaylist} 
          variant="contained" 
          color="primary"
          disabled={!selectedPlaylistId || processing}
        >
          {processing ? <CircularProgress size={24} /> : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddToPlaylistDialog;
