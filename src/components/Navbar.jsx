import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, InputBase, alpha, Menu, MenuItem, Badge, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.common.white, 0.6),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '24ch',
      '&:focus': {
        width: '32ch',
      },
    },
  },
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  borderRadius: '50%',
  padding: 8,
  color: alpha(theme.palette.common.white, 0.85),
  backgroundColor: alpha(theme.palette.common.white, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
  },
  transition: 'all 0.2s',
  marginRight: theme.spacing(1),
}));

function Navbar() {
  const { user, userProfile, getDefaultAvatar, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Obtener el valor de búsqueda de la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryFromUrl = params.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }
  }, [location.search]);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };
  
  const handleLogout = async () => {
    handleClose();
    try {
      await signOut();
      // Redirect will happen automatically through AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Manejar envío de búsqueda (al presionar Enter)
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  return (
    <AppBar position="fixed" sx={{ 
      zIndex: (theme) => theme.zIndex.drawer + 1, 
      bgcolor: '#070707',
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.8), rgba(10, 10, 10, 0.9))',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    }}>
      <Toolbar sx={{ minHeight: '64px', px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NavButton
            size="medium"
            edge="start"
            aria-label="back"
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </NavButton>
          <NavButton
            size="medium"
            edge="start"
            aria-label="forward"
          >
            <ArrowForwardIosIcon fontSize="small" />
          </NavButton>
        </Box>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Buscar música, juegos..."
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
        </Search>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Notificaciones">
            <NavButton color="inherit" sx={{ mr: 1.5 }}>
              <Badge badgeContent={0} color="primary" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </NavButton>
          </Tooltip>
          
          <Box 
            onClick={handleMenu} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: '24px',
              p: '4px 8px 4px 4px',
              cursor: 'pointer',
              bgcolor: 'rgba(255,255,255,0.05)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              transition: 'background-color 0.2s'
            }}
          >
            {userProfile?.avatar_url ? (
              <Avatar 
                src={userProfile.avatar_url} 
                alt={userProfile.username} 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  border: '2px solid rgba(30, 215, 96, 0.6)'
                }}
              />
            ) : (
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main', 
                fontSize: 14,
                border: '2px solid rgba(30, 215, 96, 0.6)'
              }}>
                {getDefaultAvatar(userProfile?.username)}
              </Avatar>
            )}
            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'medium' }}>
              {userProfile?.username || 'Usuario'}
            </Typography>
          </Box>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                bgcolor: '#181818',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                borderRadius: '12px',
                minWidth: '180px'
              }
            }}
          >
            <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
              <Typography variant="body2">Perfil</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
              <Typography variant="body2">Cerrar sesión</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;