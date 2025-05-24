import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage';
import RegisterPassengerPage from '../pages/RegisterPassengerPage';
import RegisterDriverPage from '../pages/RegisterDriverPage';
import PassengerDashboardPage from '../pages/passenger/PassengerDashboardPage';
import TrackRidePage from '../pages/passenger/TrackRidePage';
import RideHistoryPage from '../pages/passenger/RideHistoryPage';
import RateRidePage from '../pages/passenger/RateRidePage';
import ProfilePage from '../pages/passenger/ProfilePage';
import DriverDashboardPage from '../pages/driver/DriverDashboardPage';
import DriverRideNavigationPage from '../pages/driver/DriverRideNavigationPage';
import { Button, AppBar, Toolbar, Typography, Box, Menu, MenuItem, IconButton, SvgIcon } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled'; // Exemplo de ícone para logo

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.warn(`Usuário com role '${user.role}' tentou acessar uma rota para '${allowedRoles.join(', ')}'`);
    return <Navigate to="/" replace />; 
  }

  return children;
};

const AppNavbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  // Estilo para os botões da Navbar para garantir contraste
  const navbarButtonStyle = {
    color: 'inherit', // Herda a cor do texto definida na AppBar (contrastText)
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)', // Leve destaque no hover
    },
  };

  return (
    // AppBar já pega primary.main do tema para background e contrastText para cor do texto
    <AppBar position="static" elevation={1}> 
      <Toolbar>
        <DirectionsCarFilledIcon sx={{ mr: 1.5, fontSize: '2rem' }} /> 
        <Typography 
          variant="h5" 
          component={RouterLink} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            color: 'inherit', // Herda contrastText
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Mobilidade App
        </Typography>
        {isAuthenticated && user ? (
          <>
            <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block'} } }>
              Olá, {user.name || 'Usuário'}
            </Typography>
            {user.role === 'passenger' && (
              <>
                <Button sx={navbarButtonStyle} component={RouterLink} to="/passageiro/dashboard">Painel</Button>
                <Button sx={navbarButtonStyle} component={RouterLink} to="/passageiro/historico-corridas">Histórico</Button>
              </>
            )}
            {user.role === 'driver' && (
              <>
                <Button sx={navbarButtonStyle} component={RouterLink} to="/motorista/dashboard">Painel Motorista</Button>
              </>
            )}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit" // Herda contrastText
            >
              <AccountCircle sx={{ fontSize: '1.8rem' }}/>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 2, // Sombra sutil para o menu
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))', // Sombra mais customizada se necessário
                  mt: 1,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': { // Seta para o menu, opcional
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <MenuItem component={RouterLink} to={user.role === 'driver' ? "/passageiro/perfil" : "/passageiro/perfil"} onClick={handleProfileMenuClose}>
                Meu Perfil
              </MenuItem>
              <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button sx={navbarButtonStyle} component={RouterLink} to="/login">Entrar</Button>
            <Button sx={navbarButtonStyle} component={RouterLink} to="/cadastro-passageiro">Cadastrar Passageiro</Button>
            <Button sx={navbarButtonStyle} component={RouterLink} to="/cadastro-motorista">Cadastrar Motorista</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

const AppRouter = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <AppNavbar />
      <Box sx={{ mt: 0, p: 0, height: 'calc(100vh - 64px)', overflowY: 'auto', backgroundColor: (theme) => theme.palette.background.default }}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro-passageiro" element={<RegisterPassengerPage />} />
          <Route path="/cadastro-motorista" element={<RegisterDriverPage />} />

          {/* Rotas de Passageiro */}
          <Route path="/passageiro/dashboard" element={<ProtectedRoute allowedRoles={['passenger']}><PassengerDashboardPage /></ProtectedRoute>} />
          <Route path="/passageiro/corrida/acompanhar/:rideId" element={<ProtectedRoute allowedRoles={['passenger']}><TrackRidePage /></ProtectedRoute>} />
          <Route path="/passageiro/historico-corridas" element={<ProtectedRoute allowedRoles={['passenger']}><RideHistoryPage /></ProtectedRoute>} />
          <Route path="/passageiro/avaliar-corrida/:rideId" element={<ProtectedRoute allowedRoles={['passenger']}><RateRidePage /></ProtectedRoute>} />
          
          <Route path="/passageiro/perfil" element={<ProtectedRoute allowedRoles={['passenger', 'driver']}><ProfilePage /></ProtectedRoute>} />

          {/* Rotas de Motorista */}
          <Route path="/motorista/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboardPage /></ProtectedRoute>} />
          <Route path="/motorista/navegacao/:rideId" element={<ProtectedRoute allowedRoles={['driver']}><DriverRideNavigationPage /></ProtectedRoute>} />

          {/* Rota Home e Redirecionamentos */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {user && user.role === 'passenger' ? <Navigate to="/passageiro/dashboard" replace /> :
                 user && user.role === 'driver' ? <Navigate to="/motorista/dashboard" replace /> :
                 <Home /> }
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </>
  );
};

export default AppRouter;
