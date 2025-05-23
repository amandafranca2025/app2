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
import DriverRideNavigationPage from '../pages/driver/DriverRideNavigationPage'; // Importar DriverRideNavigationPage
import { Button, AppBar, Toolbar, Typography, Box, Menu, MenuItem, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

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

// Renomeado para AppNavbar para clareza
const AppNavbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate(); // Hook useNavigate para redirecionamento

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout(); // Limpa o estado de autenticação
    handleProfileMenuClose(); // Fecha o menu
    navigate('/login'); // Redireciona para a página de login
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          Mobilidade App
        </Typography>
        {isAuthenticated && user ? (
          <>
            <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block'} } }>
              Bem-vindo, {user.name || 'Usuário'}
            </Typography>
            {user.role === 'passenger' && (
              <>
                <Button color="inherit" component={RouterLink} to="/passageiro/dashboard">Painel</Button>
                <Button color="inherit" component={RouterLink} to="/passageiro/historico-corridas">Histórico</Button>
              </>
            )}
            {user.role === 'driver' && (
              <>
                <Button color="inherit" component={RouterLink} to="/motorista/dashboard">Painel Motorista</Button>
              </>
            )}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              {/* Link para Perfil (genérico ou específico por role) */}
              <MenuItem component={RouterLink} to={user.role === 'driver' ? "/passageiro/perfil" : "/passageiro/perfil"} onClick={handleProfileMenuClose}>Meu Perfil</MenuItem>
              {/* <MenuItem component={RouterLink} to={user.role === 'driver' ? "/motorista/perfil" : "/passageiro/perfil"} onClick={handleProfileMenuClose}>Meu Perfil</MenuItem> */}
              <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">Entrar</Button>
            <Button color="inherit" component={RouterLink} to="/cadastro-passageiro">Cadastrar Passageiro</Button>
            <Button color="inherit" component={RouterLink} to="/cadastro-motorista">Cadastrar Motorista</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

const AppRouter = () => {
  const { user } = useContext(AuthContext);

  return (
    // BrowserRouter é idealmente colocado em App.jsx ou main.jsx envolvendo <App />
    // Se já estiver lá, não é necessário aqui. Se não, este é o local correto.
    // Para este exemplo, assumimos que está em um nível superior.
    <>
      <AppNavbar />
      <Box sx={{ mt: 0, p: 0, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
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
          
          {/* Rota de Perfil (Compartilhada ou pode ser dividida) */}
          {/* Usando /passageiro/perfil para ambos por enquanto, mas pode ser /perfil ou /motorista/perfil */}
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
                 <Home /> /* Fallback */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </>
  );
};

export default AppRouter;
