import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Typography,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AlbumIcon from '@mui/icons-material/Album';
import { useAudio } from '../context/AudioContext';

// Formatea la duración (3:45)
const formatDuration = (duration) => {
  if (!duration) return '--:--';
  
  // Si ya está en formato mm:ss, devolverlo como está
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  // Convertir a segundos si es necesario
  const totalSeconds = typeof duration === 'number' ? duration : parseFloat(duration);
  if (isNaN(totalSeconds)) return '--:--';
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function SongList({ songs, showPlaylistInfo = false }) {
  const { play, currentTrack, isPlaying } = useAudio();
  
  const handlePlay = (song) => {
    play(song);
  };
  
  return (
    <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
      <Table sx={{ minWidth: 650 }} aria-label="song table">
        <TableHead>
          <TableRow>
            <TableCell width="60px">#</TableCell>
            <TableCell>Título</TableCell>
            <TableCell>Videojuego</TableCell>
            <TableCell>Compositor</TableCell>
            {showPlaylistInfo && <TableCell>Playlist</TableCell>}
            <TableCell align="right">Duración</TableCell>
            <TableCell width="60px">Reproducir</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {songs.map((song, index) => {
            const isCurrentSong = currentTrack && currentTrack.id === song.id;
            
            return (
              <TableRow
                key={`${song.id}-${index}`}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: isCurrentSong ? 'rgba(30, 215, 96, 0.1)' : 'inherit',
                  '&:hover': {
                    bgcolor: isCurrentSong ? 'rgba(30, 215, 96, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <TableCell component="th" scope="row">
                  {isCurrentSong ? (
                    <AlbumIcon color="primary" fontSize="small" sx={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={isCurrentSong ? 'bold' : 'normal'} color={isCurrentSong ? 'primary' : 'inherit'}>
                    {song.title}
                  </Typography>
                </TableCell>
                <TableCell>{song.game}</TableCell>
                <TableCell>{song.composer || '-'}</TableCell>
                {showPlaylistInfo && (
                  <TableCell>
                    <Chip 
                      label={song.playlistTitle || 'Desconocida'} 
                      size="small" 
                      color={song.playlistType === 'game' ? 'secondary' : 'primary'} 
                      variant="outlined"
                      icon={song.playlistType === 'game' ? <span>🎮</span> : <span>🎵</span>}
                    />
                  </TableCell>
                )}
                <TableCell align="right">{formatDuration(song.duration)}</TableCell>
                <TableCell align="center">
                  <IconButton 
                    aria-label="play"
                    onClick={() => handlePlay(song)}
                    color={isCurrentSong ? 'primary' : 'default'}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SongList;
