import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link } from 'react-router-dom';
import { usePlaylists } from '../context/PlaylistContext';

function Home() {
  const { 
    gamePlaylists, 
    generalPlaylists, 
    gamePlaylistsLoading, 
    generalPlaylistsLoading 
  } = usePlaylists();
  const [localGamePlaylists, setLocalGamePlaylists] = useState([]);
  const [localGeneralPlaylists, setLocalGeneralPlaylists] = useState([]);
  const [localGameLoading, setLocalGameLoading] = useState(true);
  const [localGeneralLoading, setLocalGeneralLoading] = useState(true);
  
  // Optimizado: Procesar playlists de juegos cuando cambian
  useEffect(() => {
    if (gamePlaylists && Object.keys(gamePlaylists).length > 0) {
      const gamePlaylistsArray = Object.values(gamePlaylists);
      setLocalGamePlaylists(gamePlaylistsArray);
    } else if (!gamePlaylistsLoading) {
      setLocalGamePlaylists([]);
    }
    
    // Actualizar estado de carga
    setLocalGameLoading(gamePlaylistsLoading);
  }, [gamePlaylists, gamePlaylistsLoading]);

  // Optimizado: Procesar playlists generales cuando cambian
  useEffect(() => {
    if (generalPlaylists && Object.keys(generalPlaylists).length > 0) {
      const generalPlaylistsArray = Object.values(generalPlaylists);
      setLocalGeneralPlaylists(generalPlaylistsArray);
    } else if (!generalPlaylistsLoading) {
      setLocalGeneralPlaylists([]);
    }
    
    // Actualizar estado de carga
    setLocalGeneralLoading(generalPlaylistsLoading);
  }, [generalPlaylists, generalPlaylistsLoading]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          height: 280, 
          mb: 4, 
          borderRadius: 2, 
          overflow: 'hidden',
          position: 'relative',
          backgroundImage: 'url(https://placehold.co/1200x300/1e3a8a/FFFFFF/png?text=Gamify)',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'flex-end'
        }}
      >
        <Box sx={{ p: 3, width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
            Bienvenido a Gamify
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'white' }}>
            La mejor colección de música de videojuegos
          </Typography>
        </Box>
      </Box>

      {/* Videojuegos Section */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Videojuegos
        </Typography>
        {localGameLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Cargando playlists...</Typography>
          </Box>
        ) : localGamePlaylists.length === 0 ? (
          <Typography>No hay playlists de videojuegos disponibles.</Typography>
        ) : (
          <Grid container spacing={2}>
            {localGamePlaylists.map((playlist) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
                <Card 
                  component={Link}
                  to={`/playlist/${playlist.id}`}
                  sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    textDecoration: 'none',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      '& .playIcon': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    } 
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="170"
                      image={playlist.image}
                      alt={playlist.title}
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
                        transform: 'translateY(10px)',
                        transition: 'all 0.3s',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {playlist.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {playlist.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {playlist.tracks ? `${playlist.tracks.length} canciones` : '0 canciones'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Playlists Section */}
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Playlists
        </Typography>
        {localGeneralLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Cargando playlists...</Typography>
          </Box>
        ) : localGeneralPlaylists.length === 0 ? (
          <Typography>No hay playlists generales disponibles.</Typography>
        ) : (
          <Grid container spacing={2}>
            {localGeneralPlaylists.map((playlist) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
                <Card 
                  component={Link}
                  to={`/playlist/${playlist.id}`}
                  sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    textDecoration: 'none',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      '& .playIcon': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    } 
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="170"
                      image={playlist.image}
                      alt={playlist.title}
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
                        transform: 'translateY(10px)',
                        transition: 'all 0.3s',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {playlist.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {playlist.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {playlist.tracks ? `${playlist.tracks.length} canciones` : '0 canciones'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Home;