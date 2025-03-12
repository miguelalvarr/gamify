import { useState, useEffect } from 'react';
import { Box, IconButton, Slider, Stack, Typography, Tooltip, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RepeatIcon from '@mui/icons-material/Repeat';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CloseIcon from '@mui/icons-material/Close';
import { useAudio } from '../context/AudioContext';
import { usePlaylists } from '../context/PlaylistContext';
import AddToPlaylistDialog from './AddToPlaylistDialog';

const AudioPlayer = ({ audioSrc }) => {
  const { currentTrack, isPlaying, togglePlayPause, audioRef, progress, duration, seek, volume, 
    setVolume, loop, toggleLoop, nextTrack, prevTrack, closePlayer } = useAudio();
  const { generalPlaylists, gamePlaylists } = usePlaylists();
  const [isMuted, setIsMuted] = useState(false);
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);

  useEffect(() => {
    // Get the audio element from the AudioContext - add safety check
    if (!audioRef) return;
    
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    // Update audio state based on local controls
    audioElement.muted = isMuted;
    
    // Ya no necesitamos estos event listeners ya que ahora se manejan en el AudioContext
    // para evitar duplicación y mejorar el rendimiento
    
    return () => {
      // Limpieza de event listeners (ya no hay ninguno que limpiar)
    };
  }, [isMuted, audioRef]);

  const toggleMute = () => {
    if (!audioRef) return;
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioElement.muted = newMutedState;
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };

  const openAddToPlaylistDialog = () => {
    setAddToPlaylistDialogOpen(true);
  };

  const closeAddToPlaylistDialog = () => {
    setAddToPlaylistDialogOpen(false);
  };

  // Función para encontrar la imagen del videojuego correspondiente
  const findGamePlaylistImage = () => {
    if (!currentTrack || !currentTrack.game) return null;
    if (!gamePlaylists || Object.keys(gamePlaylists).length === 0) return null;
    
    const gamePlaylist = Object.values(gamePlaylists).find(playlist => {
      if (!playlist || !playlist.type || !playlist.title) return false;
      
      const isGamePlaylist = playlist.type === 'game';
      const hasMatchingTrack = playlist.tracks?.some(track => 
        track?.game === currentTrack.game
      );
      const titleMatches = playlist.title.toLowerCase().includes(currentTrack.game.toLowerCase());
      
      return isGamePlaylist && (hasMatchingTrack || titleMatches);
    });
    
    return gamePlaylist?.image || null;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <Paper 
      elevation={6} 
      sx={{ 
        bgcolor: 'background.paper', 
        borderTop: 1, 
        borderColor: 'divider',
        width: '100%',
        position: 'relative',
        backgroundImage: 'linear-gradient(to bottom, #2c2c2c, #1e1e1e)',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          bgcolor: 'primary.main',
          zIndex: 1
        }}
      />
      
      <IconButton 
        onClick={closePlayer}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.3)',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.5)',
          }
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      
      <Box sx={{ p: 2, pt: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'primary.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
                backgroundImage: findGamePlaylistImage() || currentTrack.image ? `url(${findGamePlaylistImage() || currentTrack.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!findGamePlaylistImage() && !currentTrack.image && (
                <Typography variant="h6" color="white">
                  {currentTrack.title?.[0] || 'M'}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" fontWeight="medium" noWrap>
                {currentTrack.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {currentTrack.game} • {currentTrack.composer}
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: '40px', textAlign: 'center' }}>
              {formatTime(progress)}
            </Typography>
            <Slider
              value={progress}
              max={duration || 0}
              onChange={(e, newValue) => seek(newValue)}
              aria-label="time-indicator"
              size="small"
              sx={{
                height: 4,
                '& .MuiSlider-thumb': {
                  width: 8,
                  height: 8,
                  transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                  '&::before': {
                    boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                  },
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${
                      'rgb(30 215 96 / 16%)'
                    }`,
                  },
                  '&.Mui-active': {
                    width: 12,
                    height: 12,
                  },
                },
                '& .MuiSlider-rail': {
                  opacity: 0.28,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: '40px', textAlign: 'center' }}>
              {formatTime(duration)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <IconButton onClick={togglePlayPause} color="primary" size="medium" sx={{ 
                bgcolor: 'rgba(30, 215, 96, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(30, 215, 96, 0.2)',
                }
              }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Tooltip title="Repetir">
                <IconButton
                  onClick={toggleLoop}
                  color={loop ? 'primary' : 'default'}
                  size="small"
                >
                  <RepeatIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Añadir a playlist">
                <IconButton onClick={openAddToPlaylistDialog} size="small">
                  <PlaylistAddIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={toggleMute} size="small">
                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </IconButton>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                min={0}
                max={1}
                step={0.1}
                sx={{ 
                  width: 80,
                  color: 'primary.main',
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 10,
                    height: 10,
                  }
                }}
                size="small"
              />
            </Stack>
          </Stack>
        </Stack>
      </Box>
      
      <AddToPlaylistDialog
        open={addToPlaylistDialogOpen}
        onClose={closeAddToPlaylistDialog}
        song={currentTrack}
        currentPlaylistId={null}
      />
    </Paper>
  );
};

export default AudioPlayer;