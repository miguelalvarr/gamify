import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton, Divider, Skeleton, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { usePlaylists } from '../context/PlaylistContext';

function GamePlaylists() {
  const { playlists, gamePlaylistsLoading } = usePlaylists();
  const gamePlaylists = Object.values(playlists || {}).filter(playlist => playlist.type === 'game');
  const { play, isPlaying, currentTrack } = useAudio();
  
  // State for the game dialog
  const [selectedGame, setSelectedGame] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle opening the game dialog
  const handleGameClick = (game) => {
    setSelectedGame(game);
    setDialogOpen(true);
  };

  // Handle closing the game dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Música por Videojuego
      </Typography>

      {/* Game-specific playlists section */}
      <Box>
        {gamePlaylistsLoading ? (
          // Mostrar loader durante la carga
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={50} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Cargando playlists de videojuegos...
            </Typography>
          </Box>
        ) : gamePlaylists.length === 0 ? (
          // Mostrar mensaje si no hay playlists
          <Box sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 4, 
            p: 5, 
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay playlists de videojuegos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Puedes añadir nuevas playlists en la sección "Añadir Contenido"
            </Typography>
          </Box>
        ) : (
          // Mostrar grid de playlists
          <Grid container spacing={3}>
            {gamePlaylists.map((playlist) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
                <Card 
                  component={Link}
                  to={`/playlist/${playlist.id}`}
                  sx={{ 
                    height: '100%',
                    bgcolor: 'background.paper', 
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                    textDecoration: 'none',
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
                      height="170"
                      image={playlist.image || `https://placehold.co/400x170/2980b9/FFFFFF/png?text=${encodeURIComponent(playlist.title)}`}
                      alt={playlist.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box 
                      className="playIcon"
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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {playlist.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                      {playlist.description || `Playlist del videojuego ${playlist.game || playlist.title}`}
                    </Typography>
                    <Typography variant="body2" color="primary.light">
                      {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'canción' : 'canciones'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Game dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            {selectedGame?.name || 'Canciones del juego'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {selectedGame?.tracks.length > 0 ? (
            <List>
              {selectedGame.tracks.map((track, index) => {
                const isCurrentTrack = currentTrack && currentTrack.id === track.id;
                
                return (
                  <React.Fragment key={track.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      button 
                      onClick={() => play(track)}
                      sx={{ 
                        py: 1.5,
                        bgcolor: isCurrentTrack ? 'rgba(30, 215, 96, 0.1)' : 'transparent',
                        '&:hover': {
                          bgcolor: isCurrentTrack ? 'rgba(30, 215, 96, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle2" 
                            color={isCurrentTrack ? 'primary' : 'text.primary'}
                            fontWeight={isCurrentTrack ? 'bold' : 'normal'}
                          >
                            {track.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {track.composer || 'Compositor desconocido'}
                          </Typography>
                        }
                      />
                      <IconButton 
                        edge="end" 
                        aria-label="play"
                        color={isCurrentTrack && isPlaying ? 'primary' : 'default'}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" sx={{ py: 2, textAlign: 'center' }}>
              No hay canciones disponibles para este juego.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default GamePlaylists;