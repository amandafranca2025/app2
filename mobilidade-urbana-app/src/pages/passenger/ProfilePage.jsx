import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';

const ProfilePage = () => {
  const { user, updateUserProfile, loading: authLoading } = useContext(AuthContext);

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Popula o formulário com os dados do usuário quando o componente é montado ou user muda
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '', // 'name' é o campo usado no AuthContext para o nome completo
        email: user.email || '',
        phone: user.phone || '', // Adicionar 'phone' ao objeto user no AuthContext se não existir
      });
    }
  }, [user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    // Se estiver saindo do modo de edição (cancelando), restaura os dados originais
    if (isEditMode && user) {
      setFormData({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!updateUserProfile) {
        setSnackbar({ open: true, message: 'Funcionalidade de atualização não disponível.', severity: 'error'});
        return;
    }
    try {
      // Prepara os dados para atualização. O email não é atualizado aqui.
      const updatedData = {
        name: formData.fullName,
        phone: formData.phone,
        // email: formData.email // Não passamos o email para a função de update se ele não for editável
      };
      await updateUserProfile(updatedData); // Chama a função do AuthContext
      setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' });
      setIsEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      setSnackbar({ open: true, message: error.message || 'Erro ao atualizar perfil.', severity: 'error' });
    }
  };

  if (authLoading || !user) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Carregando perfil...</Typography>
      </Container>
    );
  }

  // Simulação de URL de foto do usuário
  const userPhotoUrl = user.photoURL || `https://via.placeholder.com/150/3f51b5/FFFFFF?Text=${(user.name || 'U').charAt(0)}`;

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
          Meu Perfil
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar src={userPhotoUrl} sx={{ width: 100, height: 100, mb: 2 }} />
          {/* Opção de upload de foto poderia ser adicionada aqui no futuro */}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Nome Completo"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                readOnly: !isEditMode,
              }}
              variant={isEditMode ? "outlined" : "filled"}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              fullWidth
              InputProps={{
                readOnly: true, // Email geralmente não é editável
              }}
              variant="filled" // Sempre filled para indicar não editável
              helperText="O email não pode ser alterado através desta tela."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Telefone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                readOnly: !isEditMode,
              }}
              variant={isEditMode ? "outlined" : "filled"}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {isEditMode ? (
            <>
              <Button variant="outlined" color="secondary" onClick={handleEditToggle}>
                Cancelar
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveChanges}>
                Salvar Alterações
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={handleEditToggle}>
              Editar Perfil
            </Button>
          )}
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
