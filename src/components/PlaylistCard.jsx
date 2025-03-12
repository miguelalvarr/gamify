import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function PlaylistCard({ playlist }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  // Determinar URL de imagen por defecto según el tipo de playlist
  const getDefaultImage = () => {
    if (playlist.type === 'game') {
      return 'https://placehold.co/300x300/2980b9/FFFFFF/png?text=Game';
    } else {
      return 'https://placehold.co/300x300/c0392b/FFFFFF/png?text=Playlist';
    }
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 345, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper',
        transition: 'transform 0.3s', 
        '&:hover': { 
          transform: 'scale(1.03)',
          boxShadow: 6 
        } 
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardMedia
          component="img"
          height="180"
          image={playlist.image || getDefaultImage()}
          alt={playlist.title}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {playlist.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexGrow: 1 }}>
            {playlist.description || `Playlist de ${playlist.type === 'game' ? 'videojuego' : 'música'}`}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? 'canción' : 'canciones'}
            </Typography>
            <Typography variant="body2" color="primary">
              {playlist.type === 'game' ? '🎮 Videojuego' : '🎵 General'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default PlaylistCard;
