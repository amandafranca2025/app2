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
  Paper, // Adicionar Paper
  CircularProgress // Para feedback de loading
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // Ícone para cadastro

const RegisterPassengerPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const { registerPassenger, loading } = useContext(AuthContext); // Adicionar loading
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    if (event.target.name === "password" || event.target.name === "confirmPassword") {
        setPasswordError(''); // Limpa erro de senha ao digitar
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setPasswordError('');

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("As senhas não conferem.");
      return;
    }
    // Validação de força da senha (exemplo simples)
    if (formData.password.length < 6) {
        setPasswordError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    try {
      // Passa apenas os dados necessários para registerPassenger, excluindo confirmPassword
      const { fullName, email, password, phone } = formData;
      await registerPassenger({ fullName, email, password, phone });
      navigate('/login'); 
    } catch (err) {
      console.error("Falha no cadastro:", err);
      setError(err.message || "Falha ao realizar o cadastro. Tente novamente.");
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: {xs: 2, sm: 4}, minHeight: 'calc(100vh - 64px)' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: { xs: 3, sm: 4 },
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: '12px', 
          width: '100%', // Ocupa a largura máxima do maxWidth="sm" do Container
        }}
      >
        <PersonAddIcon sx={{ fontSize: '3rem', color: 'secondary.main', mb: 2 }} />
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Crie sua Conta de Passageiro
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Rápido e fácil. Comece a viajar conosco!
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2, width: '100%', textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoComplete="name"
                name="fullName"
                required
                fullWidth
                id="fullName"
                label="Nome Completo"
                autoFocus
                value={formData.fullName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                error={!!passwordError}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Senha"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                variant="outlined"
                error={!!passwordError}
                helperText={passwordError}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="phone"
                label="Telefone (ex: 11987654321)"
                type="tel"
                id="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Cadastrar"}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <MuiLink component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Entre
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPassengerPage;
