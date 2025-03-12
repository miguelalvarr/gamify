import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, Alert, Link } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signIn, signUp, resetPassword } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (isLogin) {
        // Login
        await signIn(email, password);
        setSuccessMessage('¡Inicio de sesión exitoso!');
      } else {
        // Registration
        if (password !== confirmPassword) {
          setErrorMessage('Las contraseñas no coinciden');
          return;
        }
        
        if (!username.trim()) {
          setErrorMessage('El nombre de usuario es obligatorio');
          return;
        }
        
        const { data, error } = await signUp(email, password, username);
        if (error) throw error;
        
        setSuccessMessage('Registro exitoso. Por favor verifica tu correo electrónico para confirmar tu cuenta.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'Error de autenticación');
    }
  };
  
  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage('Por favor ingresa tu correo electrónico para restablecer la contraseña');
      return;
    }
    
    try {
      await resetPassword(email);
      setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña');
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage(error.message || 'Error al restablecer la contraseña');
    }
  };
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </Typography>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Correo Electrónico"
            type="email"
            fullWidth
            margin="normal"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {!isLogin && (
            <>
              <TextField
                label="Nombre de Usuario"
                type="text"
                fullWidth
                margin="normal"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Confirmar Contraseña"
                type="password"
                fullWidth
                margin="normal"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Button>
          
          <Grid container>
            <Grid item xs>
              {isLogin && (
                <Link href="#" variant="body2" onClick={handleResetPassword}>
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </Grid>
            <Grid item>
              <Link 
                href="#" 
                variant="body2" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;