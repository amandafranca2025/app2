import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';

const RateRidePage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { rideToRateDetails, clearRideToRate, rideHistory } = useContext(RideContext);
  const { user } = useContext(AuthContext);

  const [ratingValue, setRatingValue] = useState(0);
  const [comments, setComments] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Encontra os detalhes da corrida, seja de rideToRateDetails ou do histórico
  const [currentRide, setCurrentRide] = useState(null);

  useEffect(() => {
    let rideDetails = null;
    if (rideToRateDetails && rideToRateDetails.id === rideId) {
      rideDetails = rideToRateDetails;
    } else {
      // Tenta encontrar no histórico se não estiver em rideToRateDetails (ex: acesso direto via URL ou de um link no histórico)
      rideDetails = rideHistory.find(ride => ride.id === rideId && !ride.rated);
    }

    if (rideDetails) {
      setCurrentRide(rideDetails);
    } else {
      // Se não encontrar detalhes da corrida ou ela já foi avaliada/não existe
      setSnackbar({ open: true, message: 'Corrida não encontrada ou já avaliada.', severity: 'error' });
      navigate('/passageiro/historico-corridas');
    }
  }, [rideId, rideToRateDetails, rideHistory, navigate]);


  const handleSubmitRating = () => {
    if (ratingValue === 0) {
      setSnackbar({ open: true, message: 'Por favor, selecione uma avaliação em estrelas.', severity: 'warning' });
      return;
    }

    const evaluationData = {
      rideId: currentRide.id,
      passengerId: user.id,
      driverName: currentRide.driverName, // ou currentRide.driverInfo.name
      rating: ratingValue,
      comments: comments,
      timestamp: new Date().toISOString(),
    };

    console.log('Avaliação Enviada (Simulada):', evaluationData);

    // Limpa os detalhes da corrida a ser avaliada no contexto e marca como avaliada no histórico
    clearRideToRate(); // Esta função agora também marca a corrida como 'rated: true' no histórico

    setSnackbar({ open: true, message: 'Obrigado pela sua avaliação!', severity: 'success' });

    // Redireciona após um pequeno delay para o snackbar ser visível
    setTimeout(() => {
      navigate('/passageiro/historico-corridas');
    }, 2000);
  };

  if (!currentRide) {
    // Pode mostrar um loader ou mensagem enquanto currentRide está sendo definido pelo useEffect
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Carregando detalhes da corrida...</Typography>
      </Container>
    );
  }

  const driverName = currentRide.driverName || currentRide.driverInfo?.name || 'Motorista';
  // Simulação de URL de foto do motorista
  const driverPhotoUrl = currentRide.driverInfo?.photoUrl || `https://via.placeholder.com/150/777777/FFFFFF?Text=${driverName.charAt(0)}`;

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Avalie sua Corrida
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
          <Avatar src={driverPhotoUrl} sx={{ width: 60, height: 60, mr: 2 }} />
          <Typography variant="h6">
            Motorista: {driverName}
          </Typography>
        </Box>
        <Typography variant="body1" align="center" gutterBottom sx={{mb: 2}}>
          Veículo: {currentRide.carDetails || `${currentRide.carInfo?.model} - ${currentRide.carInfo?.plate}` || 'N/A'}
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography component="legend" variant="subtitle1">Sua avaliação (estrelas):</Typography>
          <Rating
            name="ride-rating"
            value={ratingValue}
            onChange={(event, newValue) => {
              setRatingValue(newValue);
            }}
            size="large"
          />
        </Box>

        <TextField
          id="ride-comments"
          label="Comentários (opcional)"
          multiline
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{ mb: 3 }}
        />

        <Button
          type="button"
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSubmitRating}
          disabled={ratingValue === 0} // Desabilita se nenhuma estrela for dada
        >
          Enviar Avaliação
        </Button>
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

export default RateRidePage;
