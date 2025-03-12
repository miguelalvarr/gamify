import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Paper, 
  Container, 
  Grid, 
  TextField, 
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistContext';
import { useNavigate } from 'react-router-dom';

const Input = styled('input')({
  display: 'none',
});

function Profile() {
  const { user, userProfile, uploadProfilePicture, getDefaultAvatar, updateUsername } = useAuth();
  const { generalPlaylists, generalPlaylistsLoading, loadGeneralPlaylists } = usePlaylists();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [localUserPlaylists, setLocalUserPlaylists] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const processingPlaylistsRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      console.log('Cargando playlists generales (primera carga)');
      loadGeneralPlaylists(true);
      hasLoadedRef.current = true;
    }
  }, [loadGeneralPlaylists]);

  useEffect(() => {
    if (processingPlaylistsRef.current) return;
    
    if (!generalPlaylistsLoading && generalPlaylists && user) {
      processingPlaylistsRef.current = true;
      
      console.log('Procesando playlists del usuario');
      const userPlaylistsArray = Object.values(generalPlaylists).filter(playlist => 
        playlist.userid === user.id
      );
      
      setLocalUserPlaylists(userPlaylistsArray);
      setLocalLoading(false);
      
      setTimeout(() => {
        processingPlaylistsRef.current = false;
      }, 500);
    }
  }, [generalPlaylists, user, generalPlaylistsLoading]);

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUsername(username);
      setSuccess('Nombre de usuario actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadProfilePicture(file);
      setSuccess('Foto de perfil actualizada correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              {userProfile?.avatar_url ? (
                <Avatar 
                  src={userProfile.avatar_url} 
                  alt={userProfile.username} 
                  sx={{ width: 150, height: 150 }}
                />
              ) : (
                <Avatar 
                  sx={{ width: 150, height: 150, fontSize: 64, bgcolor: 'primary.main' }}
                >
                  {getDefaultAvatar(userProfile?.username)}
                </Avatar>
              )}
              <label htmlFor="icon-button-file">
                <Input accept="image/*" id="icon-button-file" type="file" onChange={handleFileUpload} />
                <IconButton 
                  color="primary" 
                  aria-label="upload picture" 
                  component="span"
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.default' }
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
            {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Perfil de Usuario
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {isEditing ? (
              <Box component="form" onSubmit={handleUsernameUpdate} sx={{ mb: 3 }}>
                <TextField
                  label="Nombre de Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                  disabled={loading}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={loading}
                  >
                    Guardar
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(userProfile?.username || '');
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Nombre de Usuario:</strong> {userProfile?.username}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  Editar Nombre de Usuario
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Mis Playlists
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {(localLoading && hasLoadedRef.current) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : localUserPlaylists && localUserPlaylists.length > 0 ? (
        <Grid container spacing={3}>
          {localUserPlaylists.map((playlist) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <Card 
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={playlist.image || 'https://via.placeholder.com/300x140?text=Playlist'}
                  alt={playlist.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {playlist.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {playlist.description || 'Sin descripción'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {playlist.tracks ? `${playlist.tracks.length} canciones` : '0 canciones'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No has creado ninguna playlist todavía.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default Profile;