import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/config';
import { useAuth } from './AuthContext';
import { 
  fetchPlaylists, 
  fetchPlaylistsByType,
  createPlaylist as createSupabasePlaylist, 
  deletePlaylist as deleteSupabasePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  handlePlaylistImage as handleSupabasePlaylistImage,
  handleAudioFile as handleSupabaseAudioFile,
  initializeDefaultPlaylists,
  // Importar nuevas funciones para favoritos
  addPlaylistToFavorites as addPlaylistToFavoritesService,
  removePlaylistFromFavorites as removePlaylistFromFavoritesService,
  getFavoritePlaylists as getFavoritePlaylistsService,
  isPlaylistFavorite as isPlaylistFavoriteService,
  addSongToFavorites as addSongToFavoritesService,
  removeSongFromFavorites as removeSongFromFavoritesService,
  getFavoriteSongs as getFavoriteSongsService,
  isSongFavorite as isSongFavoriteService
} from '../supabase/supabaseService';

// Initial playlist data
const initialPlaylistsData = {
  1: {
    id: 1,
    title: 'Clasicos de RPG',
    description: 'Los mejores clasicos de los RPG.',
    image: 'https://placehold.co/300x300/c0392b/FFFFFF/png?text=RPG',
    type: 'game',
    tracks: [
      { id: 1, title: 'To Zanarkand', game: 'Final Fantasy X', composer: 'Nobuo Uematsu', duration: '3:54' },
      { id: 2, title: 'Corridors of Time', game: 'Chrono Trigger', composer: 'Yasunori Mitsuda', duration: '3:12' },
      { id: 3, title: 'Song of Storms', game: 'The Legend of Zelda: Ocarina of Time', composer: 'Koji Kondo', duration: '2:37' },
      { id: 4, title: 'Aeriths Theme', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:05' },
      { id: 5, title: 'Dearly Beloved', game: 'Kingdom Hearts', composer: 'Yoko Shimomura', duration: '3:28' },
      { id: 6, title: 'Main Theme', game: 'Skyrim', composer: 'Jeremy Soule', duration: '4:33' },
    ]
  },
  2: {
    id: 2,
    title: 'Música de Acción',
    description: 'Temas intensos para momentos de acción',
    image: 'https://placehold.co/300x300/c0392b/FFFFFF/png?text=Action',
    type: 'general',
    tracks: [
      { id: 1, title: 'One-Winged Angel', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:36' },
      { id: 2, title: 'Battle Theme', game: 'Pokemon', composer: 'Junichi Masuda', duration: '2:45' },
      { id: 3, title: 'E1M1', game: 'DOOM', composer: 'Bobby Prince', duration: '1:43' },
      { id: 4, title: 'Megalovania', game: 'Undertale', composer: 'Toby Fox', duration: '3:29' },
      { id: 5, title: 'Rules of Nature', game: 'Metal Gear Rising', composer: 'Jamie Christopherson', duration: '3:54' },
    ]
  },
  3: {
    id: 3,
    title: 'Bandas Sonoras Épicas',
    description: 'Música épica para aventuras inolvidables',
    image: 'https://placehold.co/300x300/2980b9/FFFFFF/png?text=Epic',
    type: 'general',
    tracks: [
      { id: 1, title: 'Main Theme', game: 'The Legend of Zelda', composer: 'Koji Kondo', duration: '2:34' },
      { id: 2, title: 'Opening Suite', game: 'Halo', composer: 'Martin O\'Donnell', duration: '4:22' },
      { id: 3, title: 'Ezio\'s Family', game: 'Assassin\'s Creed II', composer: 'Jesper Kyd', duration: '3:43' },
      { id: 4, title: 'Far Horizons', game: 'Skyrim', composer: 'Jeremy Soule', duration: '5:29' },
      { id: 5, title: 'A Beautiful Song', game: 'NieR: Automata', composer: 'Keiichi Okabe', duration: '5:02' },
    ]
  },
  4: {
    id: 4,
    title: 'Melodías Retro',
    description: 'Clásicos de la era de 8 y 16 bits',
    image: 'https://placehold.co/300x300/f39c12/FFFFFF/png?text=Retro',
    type: 'general',
    game: 'Juegos Retro',
    tracks: [
      { id: 1, title: 'Super Mario Bros Theme', game: 'Super Mario Bros', composer: 'Koji Kondo', duration: '1:28' },
      { id: 2, title: 'Green Hill Zone', game: 'Sonic the Hedgehog', composer: 'Masato Nakamura', duration: '2:14' },
      { id: 3, title: 'Tetris Theme (Korobeiniki)', game: 'Tetris', composer: 'Hirokazu Tanaka', duration: '1:17' },
      { id: 4, title: 'Baba Yetu', game: 'Civilization IV', composer: 'Christopher Tin', duration: '3:30' },
      { id: 5, title: 'Vampire Killer', game: 'Castlevania', composer: 'Kinuyo Yamashita', duration: '2:07' },
    ]
  }
};

const PlaylistContext = createContext();

// Cache de playlists con mecanismo de timeout y reintentos
const playlistCache = {
  data: {},
  gameData: {},
  generalData: {},
  lastFetchTime: 0,
  lastGameFetchTime: 0,
  lastGeneralFetchTime: 0,
  minFetchInterval: 60000, // 60 segundos
  maxCacheAge: 300000,    // 5 minutos máximo de tiempo en caché
  isFetching: false,
  isGameFetching: false,
  isGeneralFetching: false,
  fetchPromise: null,
  gameFetchPromise: null,
  generalFetchPromise: null,
  // Nuevas propiedades para control de timeout
  fetchTimeouts: {},
  resetFetchState: function(type) {
    if (type === 'game') {
      this.isGameFetching = false;
      this.gameFetchPromise = null;
      if (this.fetchTimeouts.game) {
        clearTimeout(this.fetchTimeouts.game);
        this.fetchTimeouts.game = null;
      }
    } else if (type === 'general') {
      this.isGeneralFetching = false;
      this.generalFetchPromise = null;
      if (this.fetchTimeouts.general) {
        clearTimeout(this.fetchTimeouts.general);
        this.fetchTimeouts.general = null;
      }
    } else {
      this.isFetching = false;
      this.fetchPromise = null;
      if (this.fetchTimeouts.all) {
        clearTimeout(this.fetchTimeouts.all);
        this.fetchTimeouts.all = null;
      }
    }
  }
};

export function PlaylistProvider({ children }) {
  // State for playlists and loading
  const [playlists, setPlaylists] = useState({});
  const [generalPlaylists, setGeneralPlaylists] = useState({});
  const [gamePlaylists, setGamePlaylists] = useState({});
  const [loading, setLoading] = useState(true);
  const [gamePlaylistsLoading, setGamePlaylistsLoading] = useState(true);
  const [generalPlaylistsLoading, setGeneralPlaylistsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Estado para favoritos
  const [favoritePlaylists, setFavoritePlaylists] = useState({});
  const [favoritePlaylistsLoading, setFavoritePlaylistsLoading] = useState(true);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [favoriteSongsLoading, setFavoriteSongsLoading] = useState(true);
  
  // Use the auth context instead of managing user state separately
  const { user, refreshSession } = useAuth();
  
  // Cache control - prevent excessive fetches
  const minFetchInterval = 60000; // Increased to 60 seconds minimum between fetches

  // Fetch public game playlists
  const fetchPublicGamePlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('type', 'game');
      
      if (error) throw error;
      
      // Convert array to object with id as key for compatibility with existing code
      const gamePlaylists = {};
      data.forEach((playlist) => {
        gamePlaylists[playlist.id] = playlist;
      });
      
      return gamePlaylists;
    } catch (error) {
      console.error('Error fetching public game playlists:', error);
      return {};
    }
  };

  // Función optimizada para cargar playlists de juegos
  const loadGamePlaylists = useCallback(async (forceRefresh = false) => {
    // Si ya estamos obteniendo, reutiliza la promesa existente
    if (playlistCache.isGameFetching && playlistCache.gameFetchPromise) {
      console.log('Game playlist fetch already in progress, reusing promise');
      return playlistCache.gameFetchPromise;
    }

    try {
      // Comprobar si hemos obtenido recientemente y no forzamos la actualización
      const now = Date.now();
      if (!forceRefresh && now - playlistCache.lastGameFetchTime < playlistCache.minFetchInterval) {
        console.log('Using cached game playlists');
        // Si tenemos datos en caché, usarlos
        if (Object.keys(playlistCache.gameData).length > 0) {
          setGamePlaylists(playlistCache.gameData);
          setGamePlaylistsLoading(false);
          return playlistCache.gameData;
        }
      }
      
      // Configurar flag de obtención y crear nueva promesa
      playlistCache.isGameFetching = true;
      
      // Establecer un timeout de seguridad para resetear el estado si tarda demasiado
      playlistCache.fetchTimeouts.game = setTimeout(() => {
        console.warn('Game playlist fetch timeout - resetting fetch state');
        playlistCache.resetFetchState('game');
        setGamePlaylistsLoading(false);
      }, 15000); // 15 segundos de timeout
      
      playlistCache.gameFetchPromise = (async () => {
        setGamePlaylistsLoading(true);
        
        // Obtener playlists de juegos
        const gamePlaylistsData = await fetchPublicGamePlaylists();
        
        // Limpiar el timeout ya que la operación ha terminado
        if (playlistCache.fetchTimeouts.game) {
          clearTimeout(playlistCache.fetchTimeouts.game);
          playlistCache.fetchTimeouts.game = null;
        }
        
        // Actualizar caché
        playlistCache.gameData = gamePlaylistsData;
        playlistCache.lastGameFetchTime = now;
        playlistCache.isGameFetching = false;
        
        // Actualizar estado
        setGamePlaylists(gamePlaylistsData);
        setGamePlaylistsLoading(false);
        
        return gamePlaylistsData;
      })();
      
      return await playlistCache.gameFetchPromise;
    } catch (error) {
      console.error('Error loading game playlists:', error);
      // Limpiar el timeout y resetear estado en caso de error
      playlistCache.resetFetchState('game');
      setGamePlaylistsLoading(false);
      return {};
    }
  }, []);

  // Función optimizada para cargar playlists generales
  const loadGeneralPlaylists = useCallback(async (forceRefresh = false) => {
    // Si no hay usuario, no cargar playlists generales
    if (!user) {
      setGeneralPlaylists({});
      setGeneralPlaylistsLoading(false);
      return {};
    }

    // Si ya estamos obteniendo, reutiliza la promesa existente
    if (playlistCache.isGeneralFetching && playlistCache.generalFetchPromise) {
      console.log('General playlist fetch already in progress, reusing promise');
      return playlistCache.generalFetchPromise;
    }

    try {
      // Comprobar si hemos obtenido recientemente y no forzamos la actualización
      const now = Date.now();
      if (!forceRefresh && now - playlistCache.lastGeneralFetchTime < playlistCache.minFetchInterval) {
        console.log('Using cached general playlists');
        // Si tenemos datos en caché, usarlos
        if (Object.keys(playlistCache.generalData).length > 0) {
          setGeneralPlaylists(playlistCache.generalData);
          setGeneralPlaylistsLoading(false);
          return playlistCache.generalData;
        }
      }
      
      // Configurar flag de obtención y crear nueva promesa
      playlistCache.isGeneralFetching = true;
      
      // Establecer un timeout de seguridad para resetear el estado si tarda demasiado
      playlistCache.fetchTimeouts.general = setTimeout(() => {
        console.warn('General playlist fetch timeout - resetting fetch state');
        playlistCache.resetFetchState('general');
        setGeneralPlaylistsLoading(false);
      }, 15000); // 15 segundos de timeout
      
      playlistCache.generalFetchPromise = (async () => {
        setGeneralPlaylistsLoading(true);
        
        try {
          // Obtener sólo playlists generales usando la función optimizada
          const generalPlaylistsData = await fetchPlaylistsByType(user.id, 'general');
          
          // Limpiar el timeout ya que la operación ha terminado
          if (playlistCache.fetchTimeouts.general) {
            clearTimeout(playlistCache.fetchTimeouts.general);
            playlistCache.fetchTimeouts.general = null;
          }
          
          // Actualizar caché
          playlistCache.generalData = generalPlaylistsData;
          playlistCache.lastGeneralFetchTime = now;
          
          // Actualizar estado
          setGeneralPlaylists(generalPlaylistsData);
        } catch (error) {
          console.error('Error loading general playlists:', error);
        } finally {
          playlistCache.isGeneralFetching = false;
          setGeneralPlaylistsLoading(false);
        }
        
        return playlistCache.generalData;
      })();
      
      return await playlistCache.generalFetchPromise;
    } catch (error) {
      console.error('Error in general playlists loading function:', error);
      // Limpiar el timeout y resetear estado en caso de error
      playlistCache.resetFetchState('general');
      setGeneralPlaylistsLoading(false);
      return {};
    }
  }, [user]);

  // Memoized loadPlaylists function to prevent unnecessary re-renders
  const loadPlaylists = useCallback(async (forceRefresh = false) => {
    // If we're already fetching, return the existing promise
    if (playlistCache.isFetching && playlistCache.fetchPromise) {
      console.log('Playlist fetch already in progress, reusing existing promise');
      return playlistCache.fetchPromise;
    }

    try {
      // Check if we've fetched recently and not forcing refresh
      const now = Date.now();
      if (!forceRefresh && now - playlistCache.lastFetchTime < playlistCache.minFetchInterval) {
        console.log('Using cached playlists, too soon to fetch again');
        // If we have cached data, use it
        if (Object.keys(playlistCache.data).length > 0) {
          setPlaylists(playlistCache.data);
          return;
        }
      }
      
      // Set fetching flag and create a new promise
      playlistCache.isFetching = true;
      
      // Establecer un timeout de seguridad para resetear el estado si tarda demasiado
      playlistCache.fetchTimeouts.all = setTimeout(() => {
        console.warn('Playlist fetch timeout - resetting fetch state');
        playlistCache.resetFetchState();
        setLoading(false);
      }, 15000); // 15 segundos de timeout
      
      playlistCache.fetchPromise = (async () => {
        setLoading(true);
        let userPlaylists = {};
        
        // Always fetch public game playlists
        const gamePlaylists = await fetchPublicGamePlaylists();
        
        if (user) {
          // If user is logged in, we don't need to refresh session on every playlist load
          // Only try to fetch their personal playlists
          try {
            const personalPlaylists = await fetchPlaylists(user.id);
            userPlaylists = { ...gamePlaylists, ...personalPlaylists };
            
            // Initialize default playlists if user has no personal playlists
            if (Object.keys(personalPlaylists).length === 0) {
              await initializeDefaultPlaylists(user.id);
              const initialPlaylists = await fetchPlaylists(user.id);
              userPlaylists = { ...gamePlaylists, ...initialPlaylists };
            }
          } catch (error) {
            console.error('Error loading user playlists:', error);
            // Fall back to game playlists if there's an error with user playlists
            userPlaylists = gamePlaylists;
          }
        } else {
          // If no user is logged in, just use game playlists
          userPlaylists = gamePlaylists;
        }
        
        // If we couldn't fetch any playlists, use initial data
        if (Object.keys(userPlaylists).length === 0) {
          userPlaylists = initialPlaylistsData;
        }
        
        // Limpiar el timeout ya que la operación ha terminado
        if (playlistCache.fetchTimeouts.all) {
          clearTimeout(playlistCache.fetchTimeouts.all);
          playlistCache.fetchTimeouts.all = null;
        }
        
        // Update cache
        playlistCache.data = userPlaylists;
        playlistCache.lastFetchTime = now;
        playlistCache.isFetching = false;
        
        // Update state
        setPlaylists(userPlaylists);
        setLastFetchTime(now);
        setLoading(false);
        
        return userPlaylists;
      })();
      
      return await playlistCache.fetchPromise;
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Limpiar el timeout y resetear estado en caso de error
      playlistCache.resetFetchState();
      setLoading(false);
      return initialPlaylistsData;
    }
  }, [user]);

  const loadFavoritePlaylists = useCallback(async (forceRefresh = false) => {
    // Si no hay usuario, no cargar favoritos
    if (!user) {
      setFavoritePlaylists({});
      setFavoritePlaylistsLoading(false);
      return {};
    }
    
    try {
      setFavoritePlaylistsLoading(true);
      const favorites = await getFavoritePlaylistsService(user.id);
      setFavoritePlaylists(favorites || {});
      return favorites || {};
    } catch (error) {
      console.error('Error loading favorite playlists:', error);
      setFavoritePlaylists({});
      return {};
    } finally {
      setFavoritePlaylistsLoading(false);
    }
  }, [user]);
  
  // Cargar canciones favoritas
  const loadFavoriteSongs = useCallback(async (forceRefresh = false) => {
    // Si no hay usuario, no cargar favoritos
    if (!user) {
      setFavoriteSongs([]);
      setFavoriteSongsLoading(false);
      return [];
    }
    
    try {
      setFavoriteSongsLoading(true);
      const favorites = await getFavoriteSongsService(user.id);
      setFavoriteSongs(favorites || []);
      return favorites || [];
    } catch (error) {
      console.error('Error loading favorite songs:', error);
      setFavoriteSongs([]);
      return [];
    } finally {
      setFavoriteSongsLoading(false);
    }
  }, [user]);
  // Fetch playlists when user changes or on mount
  useEffect(() => {
    if (!user) {
      // Reset playlists when user is not logged in
      setPlaylists(initialPlaylistsData);
      setLoading(false);
      return;
    }
    
    console.log('Initial load of playlists');
    loadPlaylists(true);
    loadGamePlaylists(true);
    loadGeneralPlaylists(true);
    loadFavoritePlaylists(true);  // Cargar playlists favoritas
    loadFavoriteSongs(true);      // Cargar canciones favoritas
    
    // Set up periodic refresh to keep playlists fresh, but less frequently
    const refreshInterval = setInterval(() => {
      if (user) {
        loadPlaylists(false);
        loadGamePlaylists(false);
        loadGeneralPlaylists(false);
        loadFavoritePlaylists(false);  // Actualizar favoritos periódicamente
        loadFavoriteSongs(false);      // Actualizar canciones favoritas periódicamente
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes if user is logged in (increased from 5 minutes)
    
    return () => clearInterval(refreshInterval);
  }, [user, loadPlaylists, loadGamePlaylists, loadGeneralPlaylists, loadFavoritePlaylists, loadFavoriteSongs]);

  // Event listener para detectar cuando la ventana pierde el foco y cuando lo recupera
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Si la página está oculta (en segundo plano)
      if (document.hidden) {
        console.log('Page hidden - pausing playlist operations');
        // Cancelamos cualquier promesa pendiente para evitar actualizaciones de estado mientras estamos en segundo plano
        playlistCache.resetFetchState('game');
        playlistCache.resetFetchState('general');
        playlistCache.resetFetchState();
      } else {
        // Si la página vuelve a estar visible, podemos refrescar los datos si han pasado más de 5 minutos
        console.log('Page visible again - checking if refresh needed');
        const now = Date.now();
        
        // Si el caché es antiguo, forzamos una actualización
        if (now - playlistCache.lastGameFetchTime > playlistCache.maxCacheAge) {
          console.log('Game playlists cache expired - refreshing');
          loadGamePlaylists(true);
        }
        
        if (now - playlistCache.lastGeneralFetchTime > playlistCache.maxCacheAge && user) {
          console.log('General playlists cache expired - refreshing');
          loadGeneralPlaylists(true);
        }
        
        // También verificar favoritos
        if (user) {
          loadFavoritePlaylists(true);
          loadFavoriteSongs(true);
        }
      }
    };

    // Añadir listener para el evento visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadGamePlaylists, loadGeneralPlaylists, loadFavoritePlaylists, loadFavoriteSongs, user]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state change in PlaylistContext: ${event}`);
      if (event === 'SIGNED_IN') {
        // Reload playlists when user signs in
        loadPlaylists(true);
        loadGamePlaylists(true);
        loadGeneralPlaylists(true);
        loadFavoritePlaylists(true);  // Cargar playlists favoritas
        loadFavoriteSongs(true);      // Cargar canciones favoritas al iniciar sesión
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, resetting playlists to initial data');
        // Reset to initial data when user signs out
        setPlaylists(initialPlaylistsData);
        setGamePlaylists({});
        setGeneralPlaylists({});
        setFavoritePlaylists({});    // Resetear favoritos
        setFavoriteSongs([]);        // Resetear canciones favoritas
        // Reset cache
        playlistCache.data = {};
        playlistCache.gameData = {};
        playlistCache.generalData = {};
        playlistCache.lastFetchTime = 0;
        playlistCache.lastGameFetchTime = 0;
        playlistCache.lastGeneralFetchTime = 0;
        playlistCache.isFetching = false;
        playlistCache.isGameFetching = false;
        playlistCache.isGeneralFetching = false;
        // Reset fetch time to ensure next sign-in triggers a fresh fetch
        setLastFetchTime(0);
      }
      // Removed TOKEN_REFRESHED event handler to prevent refresh loops
    });
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [loadPlaylists, loadGamePlaylists, loadGeneralPlaylists, loadFavoritePlaylists, loadFavoriteSongs]);


  // Añadir playlist a favoritos (solo playlists de juegos)
  const addPlaylistToFavorites = async (playlistId) => {
    try {
      if (!user) {
        console.error('User must be logged in to add favorites');
        return false;
      }
      
      const playlist = gamePlaylists[playlistId];
      
      // Verificar que sea una playlist de tipo game
      if (!playlist || playlist.type !== 'game') {
        console.error('Only game playlists can be added to favorites');
        return false;
      }
      
      // Añadir a favoritos en la base de datos
      await addPlaylistToFavoritesService(user.id, playlistId);
      
      // Actualizar estado local
      setFavoritePlaylists(prev => ({
        ...prev,
        [playlistId]: playlist
      }));
      
      return true;
    } catch (error) {
      console.error('Error adding playlist to favorites:', error);
      throw error;
    }
  };
  
  // Eliminar playlist de favoritos
  const removePlaylistFromFavorites = async (playlistId) => {
    try {
      if (!user) {
        console.error('User must be logged in to remove favorites');
        return false;
      }
      
      // Eliminar de favoritos en la base de datos
      await removePlaylistFromFavoritesService(user.id, playlistId);
      
      // Actualizar estado local
      setFavoritePlaylists(prev => {
        const updated = { ...prev };
        delete updated[playlistId];
        return updated;
      });
      
      return true;
    } catch (error) {
      console.error('Error removing playlist from favorites:', error);
      throw error;
    }
  };
  
  // Comprobar si una playlist está en favoritos
  const isPlaylistFavorite = async (playlistId) => {
    try {
      if (!user) return false;
      
      // Primero comprobar el estado local
      if (favoritePlaylists[playlistId]) return true;
      
      // Si no está en el estado, comprobar en la base de datos
      return await isPlaylistFavoriteService(user.id, playlistId);
    } catch (error) {
      console.error('Error checking if playlist is favorite:', error);
      return false;
    }
  };
  
  // Añadir canción a favoritos
  const addSongToFavorites = async (songId) => {
    try {
      if (!user) {
        console.error('User must be logged in to add favorites');
        return false;
      }
      
      // Añadir a favoritos en la base de datos
      await addSongToFavoritesService(user.id, songId);
      
      // Obtener datos de la canción de todas las playlists
      let songData = null;
      
      // Buscar en todas las playlists
      const allPlaylists = { ...gamePlaylists, ...generalPlaylists };
      
      for (const playlistId in allPlaylists) {
        const playlist = allPlaylists[playlistId];
        if (playlist.tracks) {
          const song = playlist.tracks.find(track => track.id === songId);
          if (song) {
            songData = song;
            break;
          }
        }
      }
      
      if (songData) {
        // Actualizar estado local
        setFavoriteSongs(prev => {
          // Si ya existe, no duplicar
          if (prev.some(s => s.id === songId)) return prev;
          return [...prev, songData];
        });
      }
      
      // Recargar favoritos para asegurar que tengamos todos los datos
      loadFavoriteSongs(true);
      
      return true;
    } catch (error) {
      console.error('Error adding song to favorites:', error);
      throw error;
    }
  };
  
  // Eliminar canción de favoritos
  const removeSongFromFavorites = async (songId) => {
    try {
      if (!user) {
        console.error('User must be logged in to remove favorites');
        return false;
      }
      
      // Eliminar de favoritos en la base de datos
      await removeSongFromFavoritesService(user.id, songId);
      
      // Actualizar estado local
      setFavoriteSongs(prev => prev.filter(song => song.id !== songId));
      
      return true;
    } catch (error) {
      console.error('Error removing song from favorites:', error);
      throw error;
    }
  };
  
  // Comprobar si una canción está en favoritos
  const isSongFavorite = async (songId) => {
    try {
      if (!user) return false;
      
      // Primero comprobar el estado local
      if (favoriteSongs.some(song => song.id === songId)) return true;
      
      // Si no está en el estado, comprobar en la base de datos
      return await isSongFavoriteService(user.id, songId);
    } catch (error) {
      console.error('Error checking if song is favorite:', error);
      return false;
    }
  };

  // Create a new playlist
  const createPlaylist = async (playlist) => {
    try {
      if (!user) {
        console.error('User must be logged in to create playlists');
        return;
      }
      
      // Create playlist in Supabase
      const newPlaylist = await createSupabasePlaylist(user.id, playlist);
      
      // Update local state based on playlist type
      if (playlist.type === 'game') {
        // Update game playlists state
        setGamePlaylists(prevPlaylists => {
          const updatedPlaylists = { ...prevPlaylists, [newPlaylist.id]: newPlaylist };
          
          // Update game cache
          playlistCache.gameData = updatedPlaylists;
          playlistCache.lastGameFetchTime = Date.now();
          
          return updatedPlaylists;
        });
      } else if (playlist.type === 'general') {
        // Update general playlists state
        setGeneralPlaylists(prevPlaylists => {
          const updatedPlaylists = { ...prevPlaylists, [newPlaylist.id]: newPlaylist };
          
          // Update general cache
          playlistCache.generalData = updatedPlaylists;
          playlistCache.lastGeneralFetchTime = Date.now();
          
          return updatedPlaylists;
        });
      }
      
      // Always update the main playlists state as well
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = { ...prevPlaylists, [newPlaylist.id]: newPlaylist };
        
        // Update main cache
        playlistCache.data = updatedPlaylists;
        
        return updatedPlaylists;
      });
      
      console.log(`Playlist creada correctamente: ${newPlaylist.title} (${newPlaylist.type})`);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  };

  // Add a new song to a playlist
  const addSong = async (playlistId, song, generalPlaylistId = null) => {
    try {
      if (!user) {
        console.error('User must be logged in to add songs');
        return;
      }
      
      // Add to the main playlist in Supabase
      const addedSong = await addSongToPlaylist(playlistId, song);
      
      // Update local state
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = { ...prevPlaylists };
        
        if (updatedPlaylists[playlistId]) {
          if (!updatedPlaylists[playlistId].tracks) {
            updatedPlaylists[playlistId].tracks = [];
          }
          updatedPlaylists[playlistId].tracks.push(addedSong);
          
          // Add to general playlist if specified
          if (generalPlaylistId && updatedPlaylists[generalPlaylistId]) {
            addSongToPlaylist(generalPlaylistId, song)
              .then(generalSong => {
                setPlaylists(prev => {
                  const updated = { ...prev };
                  if (!updated[generalPlaylistId].tracks) {
                    updated[generalPlaylistId].tracks = [];
                  }
                  updated[generalPlaylistId].tracks.push(generalSong);
                  return updated;
                });
              })
              .catch(err => console.error('Error adding song to general playlist:', err));
          }
        }
        
        // Update cache
        playlistCache.data = updatedPlaylists;
        
        return updatedPlaylists;
      });
      
      return addedSong;
    } catch (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  };

  // Handle image URLs for playlists
  const handlePlaylistImage = async (file) => {
    try {
      return await handleSupabasePlaylistImage(file);
    } catch (error) {
      console.error('Error handling playlist image:', error);
      throw error;
    }
  };

  // Handle audio file uploads
  const handleAudioFile = async (file) => {
    // Check if file exists
    if (!file) return '';
    
    // Check file size - limit to 5MB to prevent memory issues
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return Promise.reject(new Error('El archivo de audio es demasiado grande. El tamaño máximo es 5MB.'));
    }
    
    try {
      return await handleSupabaseAudioFile(file);
    } catch (error) {
      console.error('Error uploading audio file:', error);
      throw error;
    }
  };

  // Delete a playlist
  const deletePlaylist = async (playlistId) => {
    try {
      if (!user) {
        console.error('User must be logged in to delete playlists');
        return;
      }
      
      // Delete from Supabase
      await deleteSupabasePlaylist(playlistId);
      
      // Update local state
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = { ...prevPlaylists };
        delete updatedPlaylists[playlistId];
        
        // Update cache
        playlistCache.data = updatedPlaylists;
        
        return updatedPlaylists;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  };

  // Delete a song from a playlist
  const deleteSong = async (playlistId, songId) => {
    try {
      if (!user) {
        console.error('User must be logged in to delete songs');
        return;
      }
      
      // Remove from Firebase
      await removeSongFromPlaylist(playlistId, songId);
      
      // Update local state
      setPlaylists(prevPlaylists => {
        const updatedPlaylists = { ...prevPlaylists };
        if (updatedPlaylists[playlistId]) {
          updatedPlaylists[playlistId].tracks = updatedPlaylists[playlistId].tracks.filter(
            track => track.id !== songId
          );
          
          // Update cache
          playlistCache.data = updatedPlaylists;
        }
        return updatedPlaylists;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  };

  const value = {
    playlists,
    gamePlaylists,
    generalPlaylists,
    user,
    loading,
    gamePlaylistsLoading,
    generalPlaylistsLoading,
    loadPlaylists,
    loadGamePlaylists,
    loadGeneralPlaylists,
    addSong,
    createPlaylist,
    handlePlaylistImage,
    handleAudioFile,
    deletePlaylist,
    deleteSong,
    favoritePlaylists,
    favoritePlaylistsLoading,
    favoriteSongs,
    favoriteSongsLoading,
    loadFavoritePlaylists,
    loadFavoriteSongs,
    addPlaylistToFavorites,
    removePlaylistFromFavorites,
    isPlaylistFavorite,
    addSongToFavorites,
    removeSongFromFavorites,
    isSongFavorite
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
}