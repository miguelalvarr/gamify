import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, Skeleton, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, Fab, Tooltip, Tab, Tabs, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Link } from 'react-router-dom';
import { usePlaylists } from '../context/PlaylistContext';
import { useAudio } from '../context/AudioContext';

function Library() {
  const { 
    generalPlaylists, 
    generalPlaylistsLoading, 
    createPlaylist, 
    handlePlaylistImage, 
    favoritePlaylists, 
    favoritePlaylistsLoading, 
    favoriteSongs, 
    favoriteSongsLoading,
    loadFavoritePlaylists,
    loadFavoriteSongs,
    gamePlaylists
  } = usePlaylists();
  
  const { play } = useAudio();
  const [localSavedContent, setLocalSavedContent] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para el diálogo de creación de playlist
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    image: null,
    imagePreview: '',
    type: 'general',
    tracks: []
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  // Procesar las playlists cuando cambien
  useEffect(() => {
    if (generalPlaylists && Object.keys(generalPlaylists).length > 0) {
      // Tomar solo las playlists de tipo general
      const allPlaylists = Object.values(generalPlaylists).map(playlist => ({
        id: playlist.id,
        type: playlist.type,
        title: playlist.title,
        description: playlist.description,
        image: playlist.image,
        tracks: playlist.tracks ? playlist.tracks.length : 0
      }));
      
      setLocalSavedContent(allPlaylists);
    } else if (!generalPlaylistsLoading) {
      // Si no hay playlists pero no está cargando, establecer array vacío
      setLocalSavedContent([]);
    }
  }, [generalPlaylists, generalPlaylistsLoading]);

  // Cargar favoritos al montar el componente
  useEffect(() => {
    loadFavoritePlaylists();
    loadFavoriteSongs();
  }, [loadFavoritePlaylists, loadFavoriteSongs]);
  
  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Manejador para reproducir toda la playlist
  const handlePlayAll = (playlistId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const playlist = generalPlaylists[playlistId];
    if (playlist && playlist.tracks && playlist.tracks.length > 0) {
      play(playlist.tracks[0]);
    }
  };
  
  // Manejador para abrir el diálogo de creación
  const handleOpenCreateDialog = () => {
    setNewPlaylist({
      title: '',
      description: '',
      image: null,
      imagePreview: '',
      type: 'general',
      tracks: []
    });
    setError('');
    setCreateDialogOpen(true);
  };
  
  // Manejador para cerrar el diálogo
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setError('');
  };
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlaylist(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar selección de imagen
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen');
      return;
    }
    
    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es demasiado grande (máximo 2MB)');
      return;
    }
    
    // Crear URL para vista previa
    const previewUrl = URL.createObjectURL(file);
    
    setNewPlaylist(prev => ({
      ...prev,
      image: file,
      imagePreview: previewUrl
    }));
    
    setError('');
  };
  
  // Manejar creación de playlist
  const handleCreatePlaylist = async () => {
    // Validar datos
    if (!newPlaylist.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    setCreating(true);
    setError('');
    
    try {
      // Si hay imagen, subirla primero
      let imageUrl = '';
      if (newPlaylist.image) {
        imageUrl = await handlePlaylistImage(newPlaylist.image);
      } else {
        // Imagen por defecto para playlists
        imageUrl = `https://placehold.co/400x400/1DB954/FFFFFF/png?text=${encodeURIComponent(newPlaylist.title.slice(0, 10))}`;
      }
      
      // Crear la playlist
      const playlistData = {
        title: newPlaylist.title,
        description: newPlaylist.description || 'Mi playlist personal',
        image: imageUrl,
        type: 'general',
        tracks: []
      };
      
      await createPlaylist(playlistData);
      
      // Cerrar diálogo
      setCreateDialogOpen(false);
      
    } catch (err) {
      console.error('Error al crear playlist:', err);
      setError('Error al crear la playlist. Por favor, inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  // Función para reproducir una canción favorita
  const playFavoriteSong = (songId) => {
    if (!favoriteSongs || favoriteSongs.length === 0) return;
    
    // Buscar la canción por ID
    const song = favoriteSongs.find(s => s.id === songId);
    if (!song) return;
    
    // Asegurarnos de que la canción tenga todos los campos necesarios
    const enhancedSong = {
      ...song,
      // Añadir campos por defecto si no existen
      title: song.title || 'Canción sin título',
      artist: song.artist || 'Artista desconocido',
      composer: song.composer || song.artist || 'Compositor desconocido',
      game: song.game || 'Juego desconocido'
    };
    
    // Reproducir la canción
    play(enhancedSong);
  };
  
  // Función para reproducir todas las canciones favoritas
  const playAllFavoriteSongs = () => {
    if (!favoriteSongs || favoriteSongs.length === 0) return;
    
    // Obtener la primera canción
    const firstSong = favoriteSongs[0];
    
    // Asegurarnos de que la canción tenga todos los campos necesarios
    const enhancedSong = {
      ...firstSong,
      // Añadir campos por defecto si no existen
      title: firstSong.title || 'Canción sin título',
      artist: firstSong.artist || 'Artista desconocido',
      composer: firstSong.composer || firstSong.artist || 'Compositor desconocido',
      game: firstSong.game || 'Juego desconocido'
    };
    
    // Reproducir la playlist completa empezando por la primera canción
    play(enhancedSong.id, favoriteSongs.map(song => ({
      ...song,
      title: song.title || 'Canción sin título',
      artist: song.artist || 'Artista desconocido',
      composer: song.composer || song.artist || 'Compositor desconocido',
      game: song.game || 'Juego desconocido'
    })));
  };

  // Función para encontrar la imagen del videojuego correspondiente
  const findSongImage = (song) => {
    if (!song) return null;
    
    // Si la canción ya tiene imagen, la usamos
    if (song.cover_image) return song.cover_image;
    
    // Si no hay nombre de juego o no hay playlists, usamos una imagen por defecto
    if (!song.game || !gamePlaylists || Object.keys(gamePlaylists).length === 0) 
      return 'https://placehold.co/200/1DB954/FFFFFF/png?text=Music';
    
    // Buscamos la playlist que corresponde al juego de la canción
    const gamePlaylist = Object.values(gamePlaylists).find(playlist => {
      if (!playlist || !playlist.type || !playlist.title) return false;
      
      const isGamePlaylist = playlist.type === 'game';
      
      // Si el título coincide con el juego de la canción o si contiene una canción de ese juego
      const titleMatches = playlist.title.toLowerCase().includes(song.game.toLowerCase());
      const hasMatchingGame = playlist.tracks?.some(track => 
        track?.game?.toLowerCase() === song.game?.toLowerCase()
      );
      
      return isGamePlaylist && (titleMatches || hasMatchingGame);
    });
    
    return gamePlaylist?.image || 'https://placehold.co/200/1DB954/FFFFFF/png?text=Music';
  };
  
  // Función para encontrar el artista correcto
  const findSongArtist = (song) => {
    if (!song) return 'Artista desconocido';
    
    // Si la canción ya tiene artista, lo usamos
    if (song.artist) return song.artist;
    
    // Si tiene compositor, lo usamos como artista
    if (song.composer) return song.composer;
    
    // Buscamos en las playlists de juegos si hay información adicional
    if (song.game && gamePlaylists && Object.keys(gamePlaylists).length > 0) {
      const gamePlaylist = Object.values(gamePlaylists).find(playlist => {
        if (!playlist?.tracks) return false;
        
        return playlist.tracks.some(track => 
          track?.id === song.id || 
          (track?.title === song.title && track?.game === song.game)
        );
      });
      
      if (gamePlaylist) {
        const trackInPlaylist = gamePlaylist.tracks.find(track => 
          track?.id === song.id || 
          (track?.title === song.title && track?.game === song.game)
        );
        
        if (trackInPlaylist?.artist) return trackInPlaylist.artist;
        if (trackInPlaylist?.composer) return trackInPlaylist.composer;
      }
    }
    
    return 'Artista desconocido';
  };

  return (
    <Box sx={{ pb: 6, position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4
      }}>
        <Typography variant="h4" fontWeight="bold">
          Tu Biblioteca
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            borderRadius: '24px',
            px: 3,
            py: 1,
            fontWeight: 'medium',
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)'
          }}
        >
          Crear Playlist
        </Button>
      </Box>
      
      {/* Pestañas de navegación */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="biblioteca tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '1rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            }
          }}
        >
          <Tab 
            label="Mis Playlists" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            label="Playlists Favoritas" 
            id="tab-1" 
            aria-controls="tabpanel-1"
            icon={<FavoriteIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab 
            label="Canciones Favoritas" 
            id="tab-2" 
            aria-controls="tabpanel-2"
            icon={<FavoriteIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Panel de Mis Playlists */}
      {activeTab === 0 && (
        <>
          {generalPlaylistsLoading ? (
            // Loader con skeletons para mostrar durante la carga
            <Box>
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                    <Card sx={{ height: '100%', borderRadius: '16px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Skeleton variant="rectangular" height={200} animation="wave" />
                      <CardContent>
                        <Skeleton variant="text" width="80%" height={30} animation="wave" />
                        <Skeleton variant="text" width="60%" height={20} animation="wave" />
                        <Skeleton variant="text" width="40%" height={20} animation="wave" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : localSavedContent.length === 0 ? (
            // Mensaje cuando no hay playlists con botón para crear
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 4, 
              p: 6, 
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LibraryMusicIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.8 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No hay playlists en tu biblioteca
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Crea tu primera playlist para comenzar a organizar tu música favorita
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{ 
                  borderRadius: '24px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Crear mi primera playlist
              </Button>
            </Box>
          ) : (
            // Grid de playlists
            <Grid container spacing={3}>
              {localSavedContent.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card 
                    component={Link}
                    to={`/playlist/${item.id}`}
                    sx={{ 
                      height: '100%',
                      bgcolor: 'background.paper',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                        '& .playIcon': {
                          opacity: 1,
                          transform: 'translateY(0) scale(1)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={200}
                        image={item.image || `https://placehold.co/400x200/c0392b/FFFFFF/png?text=${encodeURIComponent(item.title.slice(0, 10))}`}
                        alt={item.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box 
                        className="playIcon"
                        onClick={(e) => handlePlayAll(item.id, e)}
                        sx={{ 
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transform: 'translateY(10px) scale(0.8)',
                          transition: 'all 0.3s',
                          '&:hover': { bgcolor: 'primary.dark' },
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mt: 1, 
                        mb: 'auto',
                        flexGrow: 1,
                        display: '-webkit-box', 
                        overflow: 'hidden', 
                        WebkitBoxOrient: 'vertical', 
                        WebkitLineClamp: 2
                      }}>
                        {item.description || 'Playlist personal'}
                      </Typography>
                      <Typography variant="body2" color="primary.light" sx={{ mt: 1 }}>
                        {item.tracks} {item.tracks === 1 ? 'canción' : 'canciones'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Panel de Playlists Favoritas */}
      {activeTab === 1 && (
        <>
          {favoritePlaylistsLoading ? (
            // Loader para playlists favoritas
            <Box>
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                    <Card sx={{ height: '100%', borderRadius: '16px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Skeleton variant="rectangular" height={200} animation="wave" />
                      <CardContent>
                        <Skeleton variant="text" width="80%" height={30} animation="wave" />
                        <Skeleton variant="text" width="60%" height={20} animation="wave" />
                        <Skeleton variant="text" width="40%" height={20} animation="wave" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : Object.keys(favoritePlaylists).length === 0 ? (
            // Mensaje cuando no hay playlists favoritas
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 4, 
              p: 6, 
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FavoriteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.8 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No tienes playlists favoritas
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Añade playlists de videojuegos a tus favoritos para verlas aquí
              </Typography>
            </Box>
          ) : (
            // Grid de playlists favoritas
            <Grid container spacing={3}>
              {Object.values(favoritePlaylists).map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card 
                    component={Link}
                    to={`/playlist/${item.id}`}
                    sx={{ 
                      height: '100%',
                      bgcolor: 'background.paper',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                        '& .playIcon': {
                          opacity: 1,
                          transform: 'translateY(0) scale(1)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={200}
                        image={item.image || `https://placehold.co/400x200/c0392b/FFFFFF/png?text=${encodeURIComponent(item.title)}`}
                        alt={item.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box 
                        className="playIcon"
                        onClick={(e) => handlePlayAll(item.id, e)}
                        sx={{ 
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transform: 'translateY(10px) scale(0.8)',
                          transition: 'all 0.3s',
                          '&:hover': { bgcolor: 'primary.dark' },
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mt: 1, 
                        mb: 'auto',
                        flexGrow: 1,
                        display: '-webkit-box', 
                        overflow: 'hidden', 
                        WebkitBoxOrient: 'vertical', 
                        WebkitLineClamp: 2
                      }}>
                        {item.description || 'Playlist de videojuego'}
                      </Typography>
                      <Typography variant="body2" color="primary.light" sx={{ mt: 1 }}>
                        {item.tracks?.length || 0} {item.tracks?.length === 1 ? 'canción' : 'canciones'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Panel de Canciones Favoritas */}
      {activeTab === 2 && (
        <>
          {favoriteSongsLoading ? (
            // Loader para canciones favoritas
            <Box>
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Grid item xs={12} key={item}>
                    <Box sx={{ 
                      display: 'flex', 
                      p: 2, 
                      borderRadius: '12px', 
                      bgcolor: 'background.paper',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: '8px' }} />
                      <Box sx={{ ml: 2, flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={24} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                      <Skeleton variant="circular" width={40} height={40} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : favoriteSongs?.length === 0 ? (
            // Mensaje cuando no hay canciones favoritas
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 4, 
              p: 6, 
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FavoriteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.8 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No tienes canciones favoritas
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Añade canciones a tus favoritos desde cualquier playlist para verlas aquí
              </Typography>
            </Box>
          ) : (
            // Lista de canciones favoritas
            <Box sx={{ bgcolor: 'background.paper', borderRadius: '16px', overflow: 'hidden', p: 2 }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                p: 2,
                borderRadius: '12px',
                bgcolor: 'rgba(0,0,0,0.1)'
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                  Tus Canciones Favoritas
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={playAllFavoriteSongs}
                  disabled={!favoriteSongs || favoriteSongs.length === 0}
                  sx={{
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.dark' },
                    borderRadius: '24px',
                    px: 3,
                    py: 1,
                    fontWeight: 'medium',
                    textTransform: 'none',
                  }}
                >
                  Reproducir todo
                </Button>
              </Box>
              
              <List>
                {(favoriteSongs || []).map((song, index) => (
                  <React.Fragment key={song.id}>
                    <ListItem
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          '& .MuiIconButton-root': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          variant="rounded" 
                          src={findSongImage(song)}
                          alt={song.title}
                          sx={{ width: 56, height: 56, borderRadius: '8px' }}
                        >
                          <MusicNoteIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={song.title}
                        secondary={findSongArtist(song)}
                        primaryTypographyProps={{
                          fontWeight: 'medium',
                          variant: 'subtitle1',
                          noWrap: true
                        }}
                        secondaryTypographyProps={{
                          color: 'text.secondary',
                          variant: 'body2',
                          noWrap: true
                        }}
                        sx={{ ml: 1 }}
                      />
                      <IconButton 
                        edge="end" 
                        aria-label="play"
                        onClick={() => playFavoriteSong(song.id)}
                        className="MuiIconButton-root"
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' },
                          opacity: { xs: 1, sm: 0.5 },
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </ListItem>
                    {index < favoriteSongs.length - 1 && (
                      <Divider variant="inset" component="li" sx={{ opacity: 0.2 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
      
      {/* Botón flotante para crear playlist (visible en dispositivos móviles) */}
      <Tooltip title="Crear playlist">
        <Fab 
          color="primary" 
          aria-label="add playlist" 
          onClick={handleOpenCreateDialog}
          sx={{ 
            position: 'fixed', 
            bottom: 76, 
            right: 24,
            display: { xs: 'flex', md: 'none' },
            zIndex: 10,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
      
      {/* Diálogo para crear playlist */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '16px',
            bgcolor: 'background.paper',
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.7) 0%, rgba(18,18,18,0.8) 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 'bold', 
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          Crear nueva playlist
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 2, mt: 1 }}>
            <Box 
              sx={{ 
                width: { xs: '100%', sm: 140 }, 
                height: { xs: 140, sm: 140 }, 
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                mb: { xs: 2, sm: 0 },
                mr: { xs: 0, sm: 3 },
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {newPlaylist.imagePreview ? (
                <img 
                  src={newPlaylist.imagePreview} 
                  alt="Vista previa"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              ) : (
                <>
                  <ImageIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: 'center' }}>
                    Portada de playlist
                  </Typography>
                </>
              )}
              
              <Box 
                component="input" 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                sx={{ 
                  cursor: 'pointer', 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0 
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TextField 
                name="title"
                label="Título"
                value={newPlaylist.title}
                onChange={handleInputChange}
                fullWidth
                required
                margin="dense"
                variant="filled"
                sx={{ mb: 2 }}
                InputProps={{
                  sx: { borderRadius: '8px' }
                }}
              />
              
              <TextField 
                name="description"
                label="Descripción (opcional)"
                value={newPlaylist.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                margin="dense"
                variant="filled"
                InputProps={{
                  sx: { borderRadius: '8px' }
                }}
              />
            </Box>
          </Box>
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseCreateDialog} 
            variant="outlined"
            sx={{ 
              borderRadius: '24px',
              textTransform: 'none',
              fontWeight: 'medium',
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreatePlaylist} 
            variant="contained" 
            color="primary"
            disabled={creating || !newPlaylist.title.trim()}
            sx={{ 
              borderRadius: '24px',
              textTransform: 'none',
              fontWeight: 'medium',
              px: 3
            }}
          >
            {creating ? 'Creando...' : 'Crear playlist'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Library;