import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, CircularProgress, Typography } from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import AdminPanel from './pages/AdminPanel';
import GamePlaylists from './pages/GamePlaylists';
import Profile from './pages/Profile';
import AudioPlayer from './components/AudioPlayer';
import Login from './components/Login';
import UsernameSetup from './components/UsernameSetup';
import { useAudio } from './context/AudioContext';
import { useAuth } from './context/AuthContext';
import { PlaylistProvider } from './context/PlaylistContext';
import AllSongs from './pages/AllSongs';
import SearchResults from './pages/SearchResults';
import { supabase } from './supabase/config';
import { setupRefreshHandler } from './utils/refreshHandler';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1ed760'
    },
    background: {
      default: '#121212',
      paper: '#181818'
    }
  }
});

// Sistema de rescate de emergencia para prevenir página blanca
// Si ocurre un error de autenticación o algo inesperado, podemos recuperarnos
const EmergencyRecovery = () => {
  const [isRepairing, setIsRepairing] = useState(false);
  
  const repairSession = async () => {
    setIsRepairing(true);
    
    try {
      // 1. Limpiar almacenamiento relacionado con autenticación
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      }
      
      // 2. Limpiar sessionStorage también
      sessionStorage.clear();
      
      // 3. Forzar cierre de sesión
      await supabase.auth.signOut();
      
      // 4. Recargar la aplicación, lo cual debería llevar a la página de login
      setTimeout(() => {
        window.location.href = window.location.origin + '/#/login';
      }, 1500);
      
    } catch (error) {
      console.error('Error en recuperación de emergencia:', error);
      // Si todo falla, recargar la página como último recurso
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      gap: 3
    }}>
      <Typography variant="h5" align="center">
        Ha ocurrido un problema al cargar la aplicación
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isRepairing ? (
          <>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Reparando sesión...
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body1" align="center" sx={{ mb: 2, maxWidth: '80%' }}>
              Esto puede deberse a un problema con la sesión de usuario.
              Podemos intentar repararla automáticamente.
            </Typography>
            <button 
              onClick={repairSession}
              style={{
                background: '#1ed760',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reparar Sesión
            </button>
          </>
        )}
      </Box>
    </Box>
  );
};

// Protected route component con sistema a prueba de fallos
const ProtectedRoute = ({ children }) => {
  const { user, loading, refreshSession } = useAuth();
  const [isSessionRefreshing, setIsSessionRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Detector de tiempo excesivo de carga
  useEffect(() => {
    if (loading || isSessionRefreshing) {
      // Si pasan más de 8 segundos en estado de carga, algo no está bien
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, isSessionRefreshing]);
  
  useEffect(() => {
    // Try to refresh the session if there's an authentication issue, but only if not loading
    const handleAuthIssue = async () => {
      if (!user && !loading && !isSessionRefreshing && !refreshAttempted) {
        try {
          setIsSessionRefreshing(true);
          console.log('Intentando refrescar sesión en ProtectedRoute...');
          const refreshed = await refreshSession();
          setRefreshAttempted(true);
          
          if (!refreshed) {
            console.log('Session refresh failed, redirecting to login');
          } else {
            console.log('Session refresh successful');
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
          setHasError(true);
        } finally {
          setIsSessionRefreshing(false);
        }
      }
    };
    
    handleAuthIssue();
  }, [user, loading, refreshSession, isSessionRefreshing, refreshAttempted]);
  
  // Si hay un error o ha pasado demasiado tiempo cargando, mostrar la pantalla de recuperación
  if (hasError || loadingTimeout) {
    return <EmergencyRecovery />;
  }
  
  // Esperamos hasta que completemos el intento de refrescar la sesión antes de decidir redireccionar
  if (loading || isSessionRefreshing) {
    console.log('ProtectedRoute: Loading or refreshing session...');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { user, loading, hasUsername } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const { currentTrack, audioUrl, showPlayer } = useAudio();
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  // Detector de pantalla blanca inteligente
  useEffect(() => {
    // No ejecutar en rutas de registro/signup
    const isSignupPage = location.pathname.includes('/signup') || 
                        location.pathname.includes('/register') || 
                        location.hash.includes('/signup') || 
                        location.hash.includes('/register');
    
    if (isSignupPage) {
      console.log("En página de registro, no se realizará detección de pantalla blanca");
      return;
    }
    
    // Este código solo se ejecuta después de cargar la aplicación
    // y solo si NO estamos en una página de registro
    let blankScreenTimer = null;
    
    const checkForBlankScreen = () => {
      const appContent = document.getElementById('root');
      // Si después de 5 segundos sigue sin renderizarse contenido
      // y no estamos en la página de registro/signup
      if (appContent && appContent.children.length === 0 && !isSignupPage) {
        console.log("Detectada pantalla blanca - intentando recuperación");
        // Limpiar tokens potencialmente corruptos
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key);
            }
          });
          // Redirigir al login
          window.location.href = '/#/login';
        } catch (error) {
          console.error("Error durante la recuperación:", error);
        }
      }
    };
    
    // Ejecutar detección solo cuando la página haya cargado completamente
    if (document.readyState === 'complete') {
      blankScreenTimer = setTimeout(checkForBlankScreen, 5000);
    } else {
      window.addEventListener('load', () => {
        blankScreenTimer = setTimeout(checkForBlankScreen, 5000);
      });
    }
    
    return () => {
      if (blankScreenTimer) clearTimeout(blankScreenTimer);
    };
  }, [location]); // Depende de location para detectar cambios de ruta
  
  // Sistema de protección contra carga infinita
  useEffect(() => {
    const loadingTimeoutId = setTimeout(() => {
      // Si después de 10 segundos seguimos en estado de carga inicial, 
      // algo está mal y debemos permitir que el usuario lo solucione
      if (isInitialAuthCheck) {
        console.log('Carga inicial tomando demasiado tiempo, permitiendo acceso a recuperación');
        setAuthError(true);
        setIsInitialAuthCheck(false);
      }
    }, 10000);
    
    return () => clearTimeout(loadingTimeoutId);
  }, [isInitialAuthCheck]);
  
  // Configurar el manejador de refrescos para evitar la pantalla en blanco
  useEffect(() => {
    setupRefreshHandler();
  }, []);
  
  // Detectar si estamos en un estado de recuperación (después de pantalla blanca)
  useEffect(() => {
    const isRecovery = location.hash.includes('recovery=true');
    if (isRecovery) {
      console.log('Detectado estado de recuperación, restaurando valores');
      // Limpiar localStorage para asegurar un estado limpio
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      }
    }
  }, [location]);
  
  // Attempt to refresh the session when the app loads, but only if there might be a session
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      try {
        console.log('App: Checking for existing session...');
        // Check if there's any indication of a previous session before attempting refresh
        const { data } = await supabase.auth.getSession();
        
        // Only attempt refresh if we have a valid session with both tokens
        if (data?.session?.access_token && data?.session?.refresh_token) {
          console.log('Found existing session with valid tokens, attempting refresh');
          try {
            // This will use the cached session if it was refreshed recently
            const refreshed = await refreshSession();
            console.log('App: Initial session refresh result:', refreshed ? 'success' : 'failed');
          } catch (error) {
            console.error('Error en refreshSession:', error);
            setAuthError(true);
          }
        } else if (data?.session) {
          // Session exists but is missing tokens
          console.log('Found existing session but tokens are invalid or missing');
          // Don't attempt to refresh, let the auth context handle this case
        } else {
          console.log('No session to refresh');
        }
      } catch (error) {
        console.error('Initial session refresh error:', error);
        setAuthError(true);
      } finally {
        // Marcar que ya se realizó la verificación inicial
        setIsInitialAuthCheck(false);
      }
    };
    
    // Only run this effect once when the app loads
    attemptSessionRefresh();
    
    // We don't need to refresh the session on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Si hay error de autenticación, mostrar la pantalla de recuperación
  if (authError) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <EmergencyRecovery />
      </ThemeProvider>
    );
  }
  
  // Mostrar un indicador de carga durante la verificación inicial
  if (isInitialAuthCheck) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#121212',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress />
          <Typography>Cargando aplicación...</Typography>
        </Box>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <PlaylistProvider>
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
          {user && hasUsername && (
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Navbar />
              <Sidebar />
              <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, overflow: 'auto' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/playlist/:id" element={<Playlist />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/games" element={<GamePlaylists />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/songs" element={<AllSongs />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            </Box>
          )}
          
          {!user && (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
          
          {user && !hasUsername && (
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
                <UsernameSetup />
              </Box>
            </Box>
          )}
          
          <Box sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
            maxWidth: '900px',
            zIndex: 1300,
            mb: 1,
            px: { xs: 1, sm: 2 },
            pointerEvents: 'none'
          }}>
            <Box sx={{ pointerEvents: 'auto' }}>
              {showPlayer && currentTrack && audioUrl && <AudioPlayer audioSrc={audioUrl} />}
            </Box>
          </Box>
        </Box>
      </PlaylistProvider>
    </ThemeProvider>
  );
}

export default App;
