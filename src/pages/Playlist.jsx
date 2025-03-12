import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { usePlaylists } from '../context/PlaylistContext';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, IconButton, Divider, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert, CircularProgress, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddToPlaylistDialog from '../components/AddToPlaylistDialog';

function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { play, isPlaying, currentTrack } = useAudio();
  const { 
    playlists, 
    gamePlaylists, 
    generalPlaylists, 
    gamePlaylistsLoading, 
    generalPlaylistsLoading, 
    deleteSong, 
    deletePlaylist,
    addPlaylistToFavorites,
    removePlaylistFromFavorites,
    isPlaylistFavorite,
    addSongToFavorites,
    removeSongFromFavorites,
    isSongFavorite
  } = usePlaylists();
  
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteSongs, setFavoriteSongs] = useState({});
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [playlistDeleteDialogOpen, setPlaylistDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State for add to playlist dialog
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  
  // Effect to find the playlist in all available playlists
  useEffect(() => {
    // Buscar primero en playlists combinadas por compatibilidad
    if (playlists && playlists[id]) {
      setCurrentPlaylist(playlists[id]);
      setLoading(false);
      return;
    }
    
    // Buscar en playlists de juegos
    if (gamePlaylists && gamePlaylists[id]) {
      setCurrentPlaylist(gamePlaylists[id]);
      setLoading(false);
      return;
    }
    
    // Buscar en playlists generales
    if (generalPlaylists && generalPlaylists[id]) {
      setCurrentPlaylist(generalPlaylists[id]);
      setLoading(false);
      return;
    }
    
    // Si no está cargando y no encontramos la playlist
    if (!gamePlaylistsLoading && !generalPlaylistsLoading && Object.keys(playlists).length > 0) {
      setLoading(false);
    }
  }, [id, playlists, gamePlaylists, generalPlaylists, gamePlaylistsLoading, generalPlaylistsLoading]);
  
  // Comprobar si la playlist está en favoritos
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (currentPlaylist) {
        const isPlaylistFav = await isPlaylistFavorite(id);
        setIsFavorite(isPlaylistFav);
      }
    };
    
    checkFavoriteStatus();
  }, [id, currentPlaylist, isPlaylistFavorite]);
  
  // Comprobar estado de favoritos para las canciones
  useEffect(() => {
    const checkSongsFavoriteStatus = async () => {
      if (currentPlaylist && currentPlaylist.tracks && currentPlaylist.tracks.length > 0) {
        const songFavoritesObj = {};
        
        for (const track of currentPlaylist.tracks) {
          songFavoritesObj[track.id] = await isSongFavorite(track.id);
        }
        
        setFavoriteSongs(songFavoritesObj);
      }
    };
    
    checkSongsFavoriteStatus();
  }, [currentPlaylist, isSongFavorite]);
  
  // Manejar añadir/eliminar playlist de favoritos
  const handleToggleFavoritePlaylist = async () => {
    if (!currentPlaylist) return;
    
    try {
      // Solo permitir marcar como favoritas playlists de tipo "game"
      if (!isFavorite && currentPlaylist.type !== 'game') {
        setNotification({
          open: true,
          message: 'Solo puedes añadir a favoritos las playlists de videojuegos',
          severity: 'warning'
        });
        return;
      }
      
      if (isFavorite) {
        await removePlaylistFromFavorites(id);
        setIsFavorite(false);
        setNotification({
          open: true,
          message: 'Playlist eliminada de favoritos',
          severity: 'success'
        });
      } else {
        await addPlaylistToFavorites(id);
        setIsFavorite(true);
        setNotification({
          open: true,
          message: 'Playlist añadida a favoritos',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al cambiar estado de favorito:', error);
      setNotification({
        open: true,
        message: 'Error al cambiar estado de favorito',
        severity: 'error'
      });
    }
  };
  
  // Manejar favoritos de canciones
  const handleToggleFavoriteSong = async (e, songId) => {
    e.stopPropagation();
    
    try {
      const isFav = favoriteSongs[songId];
      
      if (isFav) {
        await removeSongFromFavorites(songId);
        setFavoriteSongs(prev => ({
          ...prev,
          [songId]: false
        }));
        setNotification({
          open: true,
          message: 'Canción eliminada de favoritos',
          severity: 'success'
        });
      } else {
        await addSongToFavorites(songId);
        setFavoriteSongs(prev => ({
          ...prev,
          [songId]: true
        }));
        setNotification({
          open: true,
          message: 'Canción añadida a favoritos',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al cambiar estado de favorito de canción:', error);
      setNotification({
        open: true,
        message: 'Error al cambiar estado de favorito',
        severity: 'error'
      });
    }
  };
  
  // Handle song deletion or removal
  const handleDeleteSong = (e, songId) => {
    e.stopPropagation();
    setSongToDelete(songId);
    setDeleteDialogOpen(true);
  };
  
  // Confirm song deletion or removal
  const confirmDeleteSong = () => {
    if (songToDelete) {
      deleteSong(id, songToDelete);
      
      // Mensaje diferente según tipo de playlist
      const isGeneralPlaylist = generalPlaylists && generalPlaylists[id];
      setNotification({
        open: true,
        message: isGeneralPlaylist 
          ? 'Canción removida de la playlist correctamente' 
          : 'Canción eliminada correctamente',
        severity: 'success'
      });
    }
    setDeleteDialogOpen(false);
    setSongToDelete(null);
  };
  
  // Handle add to playlist
  const handleAddToPlaylist = (e, song) => {
    e.stopPropagation();
    setSelectedSong(song);
    setAddToPlaylistDialogOpen(true);
  };
  
  // Handle dialog close
  const handleCloseAddToPlaylistDialog = () => {
    setAddToPlaylistDialogOpen(false);
    setSelectedSong(null);
  };
  
  // Handle playlist deletion
  const handleDeletePlaylist = () => {
    setPlaylistDeleteDialogOpen(true);
  };
  
  // Confirm playlist deletion
  const confirmDeletePlaylist = () => {
    deletePlaylist(id);
    setPlaylistDeleteDialogOpen(false);
    setNotification({
      open: true,
      message: 'Playlist eliminada correctamente',
      severity: 'success'
    });
    navigate('/library');
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentPlaylist) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Typography variant="h5">Playlist no encontrada</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Playlist Header */}
      <Box sx={{ display: 'flex', mb: 4 }}>
        <Box
          component="img"
          src={currentPlaylist.image}
          alt={currentPlaylist.title}
          sx={{ width: 232, height: 232, borderRadius: 2, boxShadow: 3 }}
        />
        <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <Typography variant="overline" sx={{ color: 'grey.500' }}>
            PLAYLIST
          </Typography>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
            {currentPlaylist.title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400', mb: 1 }}>
            {currentPlaylist.description}
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {currentPlaylist.tracks.length} canciones
          </Typography>
        </Box>
      </Box>

      {/* Playlist Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            mr: 2,
            '&:hover': { bgcolor: 'primary.dark' },
            width: 56,
            height: 56
          }}
        >
          <PlayArrowIcon sx={{ fontSize: 38 }} />
        </IconButton>
        <Tooltip title={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}>
          <IconButton 
            onClick={handleToggleFavoritePlaylist}
            sx={{ 
              color: isFavorite ? 'primary.main' : 'grey.400', 
              '&:hover': { color: isFavorite ? 'error.main' : 'primary.main' }
            }}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </Tooltip>
        <IconButton 
          sx={{ color: 'grey.400' }}
          onClick={(e) => {
            e.stopPropagation();
            handleDeletePlaylist();
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Tracks List */}
      <Paper sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        {/* List Header */}
        <Box sx={{ display: 'flex', px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" fontWeight="bold" sx={{ width: 50, color: 'grey.500' }}>#</Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ flex: 1, color: 'grey.500' }}>TÍTULO</Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ width: 200, color: 'grey.500' }}>JUEGO</Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ width: 200, color: 'grey.500' }}>COMPOSITOR</Typography>
          <Box sx={{ width: 130, display: 'flex', justifyContent: 'flex-end' }}>
            <AccessTimeIcon sx={{ color: 'grey.500', fontSize: 20 }} />
          </Box>
        </Box>

        {/* Track Items */}
        <List sx={{ py: 0 }}>
          {currentPlaylist.tracks.map((track, index) => (
            <React.Fragment key={track.id}>
              <ListItem 
                onClick={() => play(track)}
                sx={{ 
                  px: 2, 
                  cursor: 'pointer',
                  bgcolor: currentTrack?.id === track.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .actionButtons': { opacity: 1 }
                  } 
                }}
              >
                <Box sx={{ width: 50, display: 'flex', alignItems: 'center' }}>
                  <Box 
                  className="playButton" 
                  sx={{ 
                    opacity: isPlaying && currentTrack?.id === track.id ? 1 : 0, 
                    mr: 1,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    play(track);
                  }}
                >
                    <PlayArrowIcon sx={{ 
                      fontSize: 18, 
                      color: isPlaying && currentTrack?.id === track.id ? 'primary.main' : 'white' 
                    }} />
                  </Box>
                  <Typography color="text.secondary">{index + 1}</Typography>
                </Box>
                <ListItemText 
                  primary={track.title} 
                  sx={{ flex: 1 }}
                />
                <Typography sx={{ width: 200, color: 'text.secondary' }}>
                  {track.game}
                </Typography>
                <Typography sx={{ width: 200, color: 'text.secondary' }}>
                  {track.composer}
                </Typography>
                <Box sx={{ width: 130, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">{track.duration}</Typography>
                  
                  <Box className="actionButtons" sx={{ display: 'flex', opacity: 0 }}>
                    {/* Botón de favoritos para la canción */}
                    <Tooltip title={favoriteSongs[track.id] ? "Eliminar de favoritos" : "Añadir a favoritos"}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleToggleFavoriteSong(e, track.id)}
                        sx={{ 
                          color: favoriteSongs[track.id] ? 'primary.main' : 'inherit',
                          '&:hover': { color: favoriteSongs[track.id] ? 'error.main' : 'primary.main' }
                        }}
                      >
                        {favoriteSongs[track.id] ? 
                          <FavoriteIcon fontSize="small" /> : 
                          <FavoriteBorderIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                    
                    {/* Botón de eliminar/remover canción según tipo de playlist */}
                    <Tooltip title={generalPlaylists && generalPlaylists[id] ? "Remover de playlist" : "Eliminar canción"}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleDeleteSong(e, track.id)}
                        sx={{ 
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        {generalPlaylists && generalPlaylists[id] ? 
                          <RemoveCircleOutlineIcon fontSize="small" /> : 
                          <DeleteIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                    
                    {/* Botón de añadir a playlist (solo visible en playlists de videojuegos) */}
                    {!(generalPlaylists && generalPlaylists[id]) && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleAddToPlaylist(e, track)}
                        sx={{ 
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </ListItem>
              {index < currentPlaylist.tracks.length - 1 && <Divider component="li" sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      {/* Delete/Remove Song Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {generalPlaylists && generalPlaylists[id] ? "Remover canción de la playlist" : "Eliminar canción"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {generalPlaylists && generalPlaylists[id] 
              ? "¿Estás seguro de que quieres remover esta canción de la playlist?"
              : "¿Estás seguro de que quieres eliminar esta canción? Esta acción no se puede deshacer."
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteSong} color="error" variant="contained">
            {generalPlaylists && generalPlaylists[id] ? "Remover" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Playlist Confirmation Dialog */}
      <Dialog
        open={playlistDeleteDialogOpen}
        onClose={() => setPlaylistDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Eliminar playlist
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar esta playlist? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlaylistDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeletePlaylist} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add to Playlist Dialog */}
      {selectedSong && (
        <AddToPlaylistDialog
          open={addToPlaylistDialogOpen}
          onClose={handleCloseAddToPlaylistDialog}
          song={selectedSong}
          playlists={generalPlaylists}
        />
      )}
      
      {/* Notificaciones */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Playlist;