import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Skeleton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { usePlaylists } from '../context/PlaylistContext';

function Sidebar() {
  const { generalPlaylists, generalPlaylistsLoading } = usePlaylists();
  
  // Filtrar solo las playlists de tipo general
  const userPlaylists = Object.values(generalPlaylists || {});
  
  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        height: '100%',
        bgcolor: 'background.paper',
        pt: 8,
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
    >
      <List>
        <ListItem button component={RouterLink} to="/" sx={{ 
          borderRadius: '8px', 
          mx: 1, 
          mb: 0.5,
          '&.active, &:hover': { bgcolor: 'rgba(255,255,255,0.08)' } 
        }}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItem>
        <ListItem button component={RouterLink} to="/library" sx={{ 
          borderRadius: '8px', 
          mx: 1, 
          mb: 0.5,
          '&.active, &:hover': { bgcolor: 'rgba(255,255,255,0.08)' } 
        }}>
          <ListItemIcon>
            <LibraryMusicIcon />
          </ListItemIcon>
          <ListItemText primary="Tu Biblioteca" />
        </ListItem>
        <ListItem button component={RouterLink} to="/games" sx={{ 
          borderRadius: '8px', 
          mx: 1, 
          mb: 0.5,
          '&.active, &:hover': { bgcolor: 'rgba(255,255,255,0.08)' } 
        }}>
          <ListItemIcon>
            <SportsEsportsIcon />
          </ListItemIcon>
          <ListItemText primary="Música por Videojuego" />
        </ListItem>
        <ListItem button component={RouterLink} to="/admin" sx={{ 
          borderRadius: '8px', 
          mx: 1, 
          mb: 0.5,
          '&.active, &:hover': { bgcolor: 'rgba(255,255,255,0.08)' } 
        }}>
          <ListItemIcon>
            <AdminPanelSettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Añadir Contenido" />
        </ListItem>
      </List>
        
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ px: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
          TUS PLAYLISTS
        </Typography>
      </Box>
        
      <List>
        {generalPlaylistsLoading ? (
          // Mostrar skeletons durante la carga
          Array(4).fill(0).map((_, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Skeleton variant="circular" width={20} height={20} />
              </ListItemIcon>
              <Skeleton variant="text" width="80%" height={24} />
            </ListItem>
          ))
        ) : userPlaylists.length === 0 ? (
          // Mostrar mensaje si no hay playlists
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText 
              primary="No hay playlists" 
              primaryTypographyProps={{ 
                variant: 'body2',
                color: 'text.secondary',
                align: 'center'
              }} 
            />
          </ListItem>
        ) : (
          // Mostrar playlists del usuario
          userPlaylists.map((playlist) => (
            <ListItem 
              button 
              key={playlist.id} 
              component={RouterLink} 
              to={`/playlist/${playlist.id}`}
              sx={{ 
                py: 0.5, 
                borderRadius: '8px', 
                mx: 1,
                mb: 0.5,
                '&.active, &:hover': { bgcolor: 'rgba(255,255,255,0.08)' } 
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PlaylistPlayIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={playlist.title} 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  noWrap: true
                }} 
              />
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}

export default Sidebar;