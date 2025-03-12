import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function UsernameSetup() {
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateUsername } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username.trim()) {
      setErrorMessage('El nombre de usuario es obligatorio');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await updateUsername(username);
      // No need to navigate - the AuthContext will update hasUsername
      // which will cause App.jsx to render the main application
    } catch (error) {
      console.error('Error setting username:', error);
      setErrorMessage(error.message || 'Error al establecer el nombre de usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Configura tu perfil
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          Para continuar, necesitas establecer un nombre de usuario único.
        </Typography>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Nombre de Usuario"
            type="text"
            fullWidth
            margin="normal"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default UsernameSetup;