import React, { useContext } from 'react';
import { RideContext } from '../../contexts/RideContext';
import {
  Container,
  Typography,
  List,
  ListItem,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ExploreIcon from '@mui/icons-material/Explore';
import PinDropIcon from '@mui/icons-material/PinDrop';
import StarBorderIcon from '@mui/icons-material/StarBorder'; // Para o botão de avaliar
import { Link as RouterLink } from 'react-router-dom'; // Para o botão de avaliar


const RideHistoryPage = () => {
  const { rideHistory } = useContext(RideContext);

  const getStatusChip = (status) => {
    if (status === 'Concluída') {
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Concluída"
          color="success"
          variant="outlined"
          size="small"
        />
      );
    } else if (status === 'Cancelada') {
      return (
        <Chip
          icon={<CancelIcon />}
          label="Cancelada"
          color="error"
          variant="outlined"
          size="small"
        />
      );
    }
    return <Chip label={status} size="small" variant="outlined" />;
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 3 }}>
        Meu Histórico de Corridas
      </Typography>

      {rideHistory && rideHistory.length > 0 ? (
        <List sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', pr: 1 }}> {/* Ajuste de altura e scroll */}
          {rideHistory.map((ride) => (
            <ListItem key={ride.id} sx={{ px: 0, mb: 2 }}>
              <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" component="span">
                          {ride.date} às {ride.time}
                        </Typography>
                      </Box>
                       <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                        <ExploreIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Partida:</strong> {ride.pickupAddress}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <PinDropIcon color="secondary" sx={{ mr: 1, mt: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Destino:</strong> {ride.destinationAddress}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4} container direction="column" alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                       <Box sx={{ mb: 1 }}>
                        {getStatusChip(ride.status)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="h6" component="span">
                          R$ {ride.fare.toFixed(2)}
                        </Typography>
                      </Box>
                      {!ride.rated && ride.status === 'Concluída' && (
                        <Button
                          component={RouterLink}
                          to={`/passageiro/avaliar-corrida/${ride.id}`}
                          variant="outlined"
                          size="small"
                          startIcon={<StarBorderIcon />}
                          sx={{ mt: 1 }}
                        >
                          Avaliar
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid container spacing={1} alignItems="center">
                     <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                           <PersonPinCircleIcon color="action" sx={{ mr: 1 }} />
                           <Typography variant="body2" color="text.secondary">
                            Motorista: {ride.driverName}
                           </Typography>
                        </Box>
                     </Grid>
                     <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                           <DirectionsCarIcon color="action" sx={{ mr: 1 }} />
                           <Typography variant="body2" color="text.secondary">
                            Veículo: {ride.carDetails}
                           </Typography>
                        </Box>
                     </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Você ainda não tem corridas no seu histórico.
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} component={RouterLink} to="/passageiro/dashboard">
            Solicitar Nova Corrida
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default RideHistoryPage;
