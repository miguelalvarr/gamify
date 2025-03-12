import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const audioRef = useRef(null);
  
  // Creamos el elemento de audio solo una vez al montar el componente
  useEffect(() => {
    // Create an actual audio element and append it to the DOM
    const audioElement = document.createElement('audio');
    audioElement.id = 'main-audio-player';
    document.body.appendChild(audioElement);
    audioRef.current = audioElement;
    
    // Configuración inicial del audio
    audioElement.volume = volume;
    audioElement.loop = loop;
    
    // Establecer los eventos básicos
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    // Aplicar eventos
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
        document.body.removeChild(audioElement);
      }
    };
  }, []);
  
  // Efecto simplificado para actualizar el progreso - usando requestAnimationFrame 
  // para mejor rendimiento y sin causar re-renders excesivos
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    let animationFrameId;
    let lastUpdateTime = 0;
    
    const updateProgress = (timestamp) => {
      // Limitar actualizaciones a máximo 4 por segundo (cada 250ms)
      if (timestamp - lastUpdateTime > 250) {
        setProgress(audio.currentTime);
        lastUpdateTime = timestamp;
      }
      
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);
  
  // Efecto para aplicar cambios en volumen y bucle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = volume;
    audio.loop = loop;
  }, [volume, loop]);

  const play = (trackId, playlist) => {
    if (!audioRef.current) return;
    
    // Si recibimos un ID y una playlist, buscamos la canción en la playlist
    let track;
    if (playlist && trackId) {
      if (Array.isArray(playlist)) {
        track = playlist.find(item => item.id === trackId);
      } else if (playlist.tracks && Array.isArray(playlist.tracks)) {
        track = playlist.tracks.find(item => item.id === trackId);
      }
      // Si no encontramos la canción, salimos
      if (!track) {
        console.error('No se encontró la canción con ID:', trackId);
        return;
      }
    } else if (typeof trackId === 'object') {
      // Si el primer parámetro es un objeto, asumimos que es la canción directamente
      track = trackId;
    } else {
      console.error('Parámetros inválidos para reproducir:', trackId, playlist);
      return;
    }
    
    if (currentTrack && currentTrack.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
          });
        }
        setIsPlaying(true);
        // Aseguramos que el reproductor sea visible incluso al reanudar la misma canción
        setShowPlayer(true);
      }
    } else {
      const audioFiles = {
        'To Zanarkand': '/audio/to-zanarkand.mp3',
        'Corridors of Time': '/audio/corridors-of-time.mp3',
        'Song of Storms': '/audio/song-of-storms.mp3',
        'Aeriths Theme': '/audio/aeriths-theme.mp3',
        'Dearly Beloved': '/audio/dearly-beloved.mp3',
        'Main Theme': '/audio/main-theme.mp3',
        'One-Winged Angel': '/audio/one-winged-angel.mp3',
        'Battle Theme': '/audio/battle-theme.mp3',
        'E1M1': '/audio/e1m1.mp3',
        'Megalovania': '/audio/megalovania.mp3',
        'Rules of Nature': '/audio/rules-of-nature.mp3',
        'Super Mario Bros Theme': '/audio/super-mario-bros.mp3',
        'Green Hill Zone': '/audio/green-hill-zone.mp3',
        'Tetris Theme (Korobeiniki)': '/audio/tetris-theme.mp3',
        'Baba Yetu': '/audio/baba-yetu.mp3',
        'Vampire Killer': '/audio/vampire-killer.mp3'
      };
      
      // First check if the track has an audioUrl property (for user-uploaded files)
      // Also check for audiourl (lowercase) for compatibility with Supabase
      // If not found, try to find it in the audioFiles mapping
      // If still not found, use a default sample
      const trackAudioUrl = track.audioUrl || track.audiourl || audioFiles[track.title] || 'https://audio-samples.github.io/samples/mp3/sample1.mp3';
      
      if (audioRef.current) {
        audioRef.current.pause();
        
        // Reiniciar el progreso
        setProgress(0);
        
        // Asignar la nueva URL y reproducir
        audioRef.current.src = trackAudioUrl;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
          });
        }
      }
      
      setCurrentTrack(track);
      setAudioUrl(trackAudioUrl);
      setIsPlaying(true);
      setShowPlayer(true);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to a specific time
  const seek = (time) => {
    if (!audioRef.current) return;
    
    // Asegurarse de que el tiempo no exceda la duración
    const safeTime = Math.min(time, audioRef.current.duration || 0);
    
    // Actualizar el tiempo de reproducción
    audioRef.current.currentTime = safeTime;
    setProgress(safeTime);
  };

  // Toggle loop
  const toggleLoop = () => {
    if (!audioRef.current) return;
    const newLoopState = !loop;
    audioRef.current.loop = newLoopState;
    setLoop(newLoopState);
  };

  // Play next track (placeholder - to be implemented based on playlist)
  const nextTrack = () => {
    console.log('Next track function not implemented yet');
  };

  // Play previous track (placeholder - to be implemented based on playlist)
  const prevTrack = () => {
    console.log('Previous track function not implemented yet');
  };

  // Close player
  const closePlayer = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    setShowPlayer(false);
  };

  const value = {
    audioRef,
    isPlaying,
    currentTrack,
    audioUrl,
    progress,
    duration,
    volume,
    loop,
    play,
    showPlayer,
    setShowPlayer,
    togglePlayPause,
    seek,
    setVolume,
    toggleLoop,
    nextTrack,
    prevTrack,
    closePlayer
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}