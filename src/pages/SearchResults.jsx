import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Grid, CircularProgress, Tabs, Tab } from '@mui/material';
import { usePlaylists } from '../context/PlaylistContext';
import PlaylistCard from '../components/PlaylistCard';
import SongList from '../components/SongList';

function SearchResults() {
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('q') || '';
  const { gamePlaylists, generalPlaylists, gamePlaylistsLoading, generalPlaylistsLoading } = usePlaylists();
  const [tabValue, setTabValue] = useState(0);
  const [filteredGamePlaylists, setFilteredGamePlaylists] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para manejar cambios de tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Función para filtrar playlists por la búsqueda
  useEffect(() => {
    setLoading(true);
    
    if (searchQuery) {
      // Filtrar playlists de juegos que coincidan con la búsqueda
      const gamePlaylistsArr = Object.values(gamePlaylists || {});
      const matchingGamePlaylists = gamePlaylistsArr.filter(playlist => {
        const titleMatch = playlist.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const gameMatch = playlist.game?.toLowerCase().includes(searchQuery.toLowerCase());
        const descriptionMatch = playlist.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || gameMatch || descriptionMatch;
      });
      setFilteredGamePlaylists(matchingGamePlaylists);
      
      // Filtrar canciones de todas las playlists
      const allSongs = [];
      
      // Buscar en playlists de juegos
      gamePlaylistsArr.forEach(playlist => {
        if (playlist.tracks && Array.isArray(playlist.tracks)) {
          playlist.tracks.forEach(track => {
            if (
              track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              track.game?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              track.composer?.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              allSongs.push({
                ...track,
                playlistId: playlist.id,
                playlistType: 'game',
                playlistTitle: playlist.title
              });
            }
          });
        }
      });
      
      // Buscar en playlists generales
      const generalPlaylistsArr = Object.values(generalPlaylists || {});
      generalPlaylistsArr.forEach(playlist => {
        if (playlist.tracks && Array.isArray(playlist.tracks)) {
          playlist.tracks.forEach(track => {
            if (
              track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              track.game?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              track.composer?.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              allSongs.push({
                ...track,
                playlistId: playlist.id,
                playlistType: 'general',
                playlistTitle: playlist.title
              });
            }
          });
        }
      });
      
      // Eliminar duplicados (si hay canciones en múltiples playlists)
      const uniqueSongs = allSongs.filter((song, index, self) =>
        index === self.findIndex((s) => s.title === song.title && s.game === song.game)
      );
      
      setFilteredSongs(uniqueSongs);
    } else {
      setFilteredGamePlaylists([]);
      setFilteredSongs([]);
    }
    
    setLoading(false);
  }, [searchQuery, gamePlaylists, generalPlaylists]);

  return (
    <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Resultados para: "{searchQuery}"
      </Typography>
      
      {loading || gamePlaylistsLoading || generalPlaylistsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="search results tabs">
              <Tab label={`Playlists (${filteredGamePlaylists.length})`} />
              <Tab label={`Canciones (${filteredSongs.length})`} />
            </Tabs>
          </Box>
          
          {tabValue === 0 ? (
            <Box>
              {filteredGamePlaylists.length > 0 ? (
                <Grid container spacing={2}>
                  {filteredGamePlaylists.map((playlist) => (
                    <Grid item key={playlist.id} xs={12} sm={6} md={4} lg={3}>
                      <PlaylistCard playlist={playlist} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No se encontraron playlists para "{searchQuery}"
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              {filteredSongs.length > 0 ? (
                <SongList songs={filteredSongs} showPlaylistInfo={true} />
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No se encontraron canciones para "{searchQuery}"
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default SearchResults;
