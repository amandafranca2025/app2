import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { RideProvider } from './contexts/RideContext'; // Importar RideProvider

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RideProvider> {/* Envolver AppRouter (ou parte dele) com RideProvider */}
          <AppRouter />
        </RideProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
