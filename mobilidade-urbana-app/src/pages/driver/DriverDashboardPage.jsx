import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corrigir ícone padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Posição inicial do motorista (Ex: Centro de São Paulo)
const initialDriverPosition = [-23.55052, -46.633308];

// Componente para centralizar mapa na posição do motorista
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const DriverDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const {
    pendingRides,
    simulate_acceptRideByDriver, // Renomeado para clareza, será definido no RideContext
    simulate_rejectRideByDriver, // Renomeado para clareza, será definido no RideContext
    simulate_newRideRequest,     // Para adicionar novas corridas pendentes
    clearPendingRides            // Para limpar corridas pendentes (ex: ao ficar offline)
  } = useContext(RideContext);

  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState(initialDriverPosition); // Posição atual do motorista
  const [loading, setLoading] = useState(false); // Para feedback de ações
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Efeito para buscar localização do motorista (simples, pode ser melhorado)
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDriverLocation([latitude, longitude]);
        },
        (error) => {
          console.warn("Erro ao obter geolocalização:", error);
          setSnackbar({ open: true, message: 'Não foi possível obter sua localização atual. Usando localização padrão.', severity: 'warning' });
          // Mantém a localização inicial ou uma padrão se a geolocalização falhar
        },
        { enableHighAccuracy: true }
      );
    }
  }, [isOnline]);


  // Simulação de novas corridas chegando quando online
  useEffect(() => {
    let rideRequestInterval;
    if (isOnline && simulate_newRideRequest) {
      // Adiciona uma corrida de teste imediatamente ao ficar online (se não houver pendentes)
      if (pendingRides.length === 0) {
          simulate_newRideRequest({
            id: `req_${Date.now()}_test`,
            pickupAddress: 'Rua Fictícia de Partida, 123',
            destinationAddress: 'Avenida Imaginária de Destino, 789',
            estimatedFare: (Math.random() * 30 + 15).toFixed(2), // Entre 15 e 45
            pickupLocation: { lat: initialDriverPosition[0] + 0.02, lng: initialDriverPosition[1] + 0.02 },
            destinationLocation: { lat: initialDriverPosition[0] + 0.05, lng: initialDriverPosition[1] + 0.05 },
          });
      }

      rideRequestInterval = setInterval(() => {
        // Adiciona uma nova solicitação simulada
        const newRide = {
          id: `req_${Date.now()}`,
          pickupAddress: `Ponto de Partida Aleatório ${Math.floor(Math.random() * 100)}`,
          destinationAddress: `Destino Aleatório ${Math.floor(Math.random() * 1000)}`,
          estimatedFare: (Math.random() * 25 + 10).toFixed(2), // Ganho entre 10 e 35
           // Gera localizações aleatórias próximas à posição inicial para simulação
          pickupLocation: {
            lat: initialDriverPosition[0] + (Math.random() - 0.5) * 0.1, // Variação de ~5.5km
            lng: initialDriverPosition[1] + (Math.random() - 0.5) * 0.1,
          },
          destinationLocation: {
            lat: initialDriverPosition[0] + (Math.random() - 0.5) * 0.2, // Variação de ~11km
            lng: initialDriverPosition[1] + (Math.random() - 0.5) * 0.2,
          },
        };
        simulate_newRideRequest(newRide);
        setSnackbar({ open: true, message: 'Nova solicitação de corrida!', severity: 'info' });
      }, 25000); // Nova solicitação a cada 25 segundos
    } else {
      // Se ficar offline, limpa o intervalo e as corridas pendentes
      if (rideRequestInterval) clearInterval(rideRequestInterval);
      if (clearPendingRides) clearPendingRides();
    }
    return () => clearInterval(rideRequestInterval);
  }, [isOnline, simulate_newRideRequest, clearPendingRides, pendingRides?.length]); // Adicionado pendingRides.length para re-executar se ficar online e não tiver corridas

  const handleOnlineToggle = (event) => {
    setIsOnline(event.target.checked);
    if (!event.target.checked) {
      setSnackbar({ open: true, message: 'Você está offline.', severity: 'warning' });
      if (clearPendingRides) clearPendingRides(); // Limpa corridas pendentes ao ficar offline
    } else {
      setSnackbar({ open: true, message: 'Você está online. Aguardando corridas...', severity: 'success' });
    }
  };

  const handleAcceptRide = async (rideRequest) => {
    if (!simulate_acceptRideByDriver) return;
    setLoading(true);
    try {
      // Adiciona a localização atual do motorista aos detalhes da corrida aceita
      const rideDetailsForAcceptance = {
        ...rideRequest,
        driverCurrentLocation: { lat: driverLocation[0], lng: driverLocation[1] },
        driverInfo: { // Informações do motorista logado
            name: user?.name || 'Motorista Padrão',
            id: user?.id,
            // photoUrl: user?.photoURL // Adicionar se tiver
        },
        carInfo: { // Informações do veículo do motorista (do perfil do motorista, se houver)
            model: user?.vehicleModel || 'Veículo Padrão',
            plate: user?.vehiclePlate || 'ABC-1234',
        }
      };

      const acceptedRide = await simulate_acceptRideByDriver(rideDetailsForAcceptance);
      if (acceptedRide) {
        setSnackbar({ open: true, message: `Corrida aceita! ID: ${acceptedRide.id}`, severity: 'success' });
        navigate(`/motorista/navegacao/${acceptedRide.id}`); // Navega para a tela de navegação da corrida
      } else {
        throw new Error("Não foi possível aceitar a corrida no contexto.");
      }
    } catch (error) {
      console.error("Erro ao aceitar corrida:", error);
      setSnackbar({ open: true, message: error.message || 'Erro ao aceitar corrida.', severity: 'error' });
    }
    setLoading(false);
  };

  const handleRejectRide = async (rideId) => {
    if (!simulate_rejectRideByDriver) return;
    setLoading(true);
    try {
      await simulate_rejectRideByDriver(rideId);
      setSnackbar({ open: true, message: `Corrida ${rideId} rejeitada.`, severity: 'info' });
    } catch (error) {
      console.error("Erro ao rejeitar corrida:", error);
      setSnackbar({ open: true, message: 'Erro ao rejeitar corrida.', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Container sx={{ py: 2, height: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h5" component="h1">
              Painel do Motorista
            </Typography>
          </Grid>
          <Grid item>
            <FormControlLabel
              control={<Switch checked={isOnline} onChange={handleOnlineToggle} color="primary" />}
              label={isOnline ? "Online" : "Offline"}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Coluna do Mapa */}
        <Grid item xs={12} md={7} sx={{ height: { xs: '300px', md: 'auto' } }}>
          <Paper elevation={3} sx={{ height: '100%', p: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ml: 1}}>Minha Localização</Typography>
            <MapContainer center={driverLocation} zoom={14} style={{ height: 'calc(100% - 40px)', width: '100%' }}>
              <ChangeView center={driverLocation} zoom={14} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={driverLocation}>
                <Popup>Você está aqui.</Popup>
              </Marker>
            </MapContainer>
          </Paper>
        </Grid>

        {/* Coluna de Solicitações de Corrida */}
        <Grid item xs={12} md={5} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 2, flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
            <Typography variant="h6" gutterBottom>
              {isOnline ? "Solicitações de Corrida Disponíveis" : "Fique online para ver solicitações"}
            </Typography>
            {isOnline ? (
              pendingRides && pendingRides.length > 0 ? (
                <List>
                  {pendingRides.map((ride) => (
                    <ListItem key={ride.id} sx={{ px: 0, mb: 1.5 }}>
                      <Card variant="outlined" sx={{ width: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Nova Solicitação</Typography>
                          <Typography variant="body2"><strong>Partida:</strong> {ride.pickupAddress}</Typography>
                          <Typography variant="body2"><strong>Destino:</strong> {ride.destinationAddress}</Typography>
                          <Typography variant="body1" color="primary" sx={{mt: 1}}>
                            <strong>Ganho Estimado: R$ {ride.estimatedFare}</strong>
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-around' }}>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleAcceptRide(ride)}
                            disabled={loading}
                          >
                            Aceitar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRejectRide(ride.id)}
                            disabled={loading}
                          >
                            Rejeitar
                          </Button>
                        </CardActions>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{textAlign: 'center', mt: 3}}>Nenhuma solicitação no momento. Aguardando...</Typography>
              )
            ) : (
              <Typography sx={{textAlign: 'center', mt: 3}}>Você está offline.</Typography>
            )}
            {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default DriverDashboardPage;
