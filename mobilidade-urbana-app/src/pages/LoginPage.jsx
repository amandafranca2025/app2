import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link as MuiLink, 
  Grid,
  Paper, // Adicionar Paper para o efeito de card
  CircularProgress // Para feedback de loading
} from '@mui/material';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled'; // Ícone similar ao do app

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useContext(AuthContext); // Adicionar loading do AuthContext
  const navigate = useNavigate();
  const [error, setError] = useState('');


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpa erros anteriores
    try {
      await login(email, password);
      navigate('/'); 
    } catch (err) {
      console.error("Falha no login:", err);
      setError(err.message || "Falha no login. Verifique suas credenciais.");
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px - 32px)' }}> {/* 64px navbar, 32px padding */}
      <Paper 
        elevation={3} 
        sx={{ 
          padding: { xs: 3, sm: 4 }, // Padding responsivo
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: '12px', // Cantos arredondados para o Paper
          mt: { xs: 0, sm: -8 } // Ajuste de margem para centralizar melhor em telas maiores
        }}
      >
        <DirectionsCarFilledIcon sx={{ fontSize: '3rem', color: 'primary.main', mb: 2 }} />
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Entrar
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Acesse sua conta para continuar.
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2, width: '100%', textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Seu email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined" // Usar outlined para um look mais moderno
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Sua senha"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained" // O tema já estiliza containedPrimary
            color="primary" 
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }} // Botão maior
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
          </Button>
          <Grid container spacing={1.5} justifyContent="space-between">
            <Grid item xs={12} sm>
              <MuiLink component={RouterLink} to="/cadastro-passageiro" variant="body2" sx={{ display: 'block', textAlign: { xs: 'center', sm: 'left' }}}>
                Cadastre-se como Passageiro
              </MuiLink>
            </Grid>
            <Grid item xs={12} sm="auto">
              <MuiLink component={RouterLink} to="/cadastro-motorista" variant="body2" sx={{ display: 'block', textAlign: { xs: 'center', sm: 'right' }}}>
                Seja um motorista
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
