import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
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

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading, refreshSession } = useAuth();
  
  useEffect(() => {
    // Try to refresh the session if there's an authentication issue, but only if not loading
    const handleAuthIssue = async () => {
      if (!user && !loading) {
        try {
          // We don't need to refresh on every route change - the session cache in AuthContext
          // will prevent excessive refreshes
          const refreshed = await refreshSession();
          if (!refreshed) {
            // If refresh failed, we'll redirect to login in the render below
            console.log('Session refresh failed, redirecting to login');
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
        }
      }
    };
    
    handleAuthIssue();
  }, [user, loading, refreshSession]);
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [profile, setProfile] = useState(null);
  const { currentTrack, audioUrl, showPlayer } = useAudio();
  const { user, hasUsername, refreshSession } = useAuth();
  
  // Configurar el manejador de refrescos para evitar la pantalla en blanco
  useEffect(() => {
    setupRefreshHandler();
  }, []);
  
  // Attempt to refresh the session when the app loads, but only if there might be a session
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      try {
        // Check if there's any indication of a previous session before attempting refresh
        const { data } = await supabase.auth.getSession();
        
        // Only attempt refresh if we have a valid session with both tokens
        if (data?.session?.access_token && data?.session?.refresh_token) {
          console.log('Found existing session with valid tokens, attempting refresh');
          // This will use the cached session if it was refreshed recently
          const refreshed = await refreshSession();
          console.log('Session refresh result:', refreshed ? 'success' : 'failed');
        } else if (data?.session) {
          // Session exists but is missing tokens
          console.log('Found existing session but tokens are invalid or missing');
          // Don't attempt to refresh, let the auth context handle this case
        } else {
          console.log('No session to refresh');
        }
      } catch (error) {
        console.error('Initial session refresh error:', error);
        // Don't sign out on refresh errors, just log them
      }
    };
    
    // Only run this effect once when the app loads
    attemptSessionRefresh();
    
    // We don't need to refresh the session on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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