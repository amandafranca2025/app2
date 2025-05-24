import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext';
import {
  Container, Paper, Typography, Switch, FormControlLabel, Box, Grid,
  Card, CardContent, CardActions, Button, Snackbar, Alert, List, ListItem, CircularProgress
} from '@mui/material';

// Mapbox Imports
import MapboxMap from '../../components/common/MapboxMap';
import { Marker as MapboxMarker, Popup as MapboxPopup } from 'react-map-gl';
import PersonPinIcon from '@mui/icons-material/PersonPin';     // Ícone para local de partida da corrida
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Ícone para motorista

// Posição inicial do motorista (Ex: Centro de São Paulo)
const initialDriverPosition = { longitude: -46.633308, latitude: -23.55052 };

const DriverDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const {
    pendingRides,
    simulate_acceptRideByDriver,
    simulate_rejectRideByDriver,
    simulate_newRideRequest,
    clearPendingRides
  } = useContext(RideContext);

  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  // Driver location state: { longitude, latitude }
  const [driverLocation, setDriverLocation] = useState(initialDriverPosition);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const mapRef = useRef(null); // Para interações com o mapa Mapbox

  // Viewport state para o mapa Mapbox
  const [viewState, setViewState] = useState({
    ...initialDriverPosition,
    zoom: 13
  });
  
  const [selectedRidePopup, setSelectedRidePopup] = useState(null); // Para popup de corrida no mapa

  // Efeito para buscar localização do motorista
  useEffect(() => {
    let watchId = null;
    if (isOnline && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { longitude, latitude };
          setDriverLocation(newLocation);
          // Atualiza o viewState para centralizar no motorista apenas se o mapa não estiver sendo arrastado manualmente (opcional)
          setViewState(prev => ({ ...prev, longitude: newLocation.longitude, latitude: newLocation.latitude, zoom: Math.max(prev.zoom, 14) }));
        },
        (error) => {
          console.warn("Erro ao obter geolocalização:", error);
          setSnackbar({ open: true, message: 'Não foi possível obter sua localização. Usando localização padrão.', severity: 'warning' });
          setDriverLocation(initialDriverPosition); // Volta para a posição inicial em caso de erro
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setDriverLocation(initialDriverPosition); // Se offline, reseta para a posição inicial
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline]);

  // Simulação de novas corridas chegando quando online
  useEffect(() => {
    let rideRequestInterval;
    if (isOnline && simulate_newRideRequest) {
      if (pendingRides.length === 0) {
        simulate_newRideRequest({
          id: `req_${Date.now()}_test`,
          pickupAddress: 'Rua Fictícia de Partida, 123 (Exemplo)',
          destinationAddress: 'Avenida Imaginária de Destino, 789',
          estimatedFare: (Math.random() * 30 + 15).toFixed(2),
          pickupLocation: { latitude: initialDriverPosition.latitude + 0.02, longitude: initialDriverPosition.longitude + 0.02 },
          destinationLocation: { latitude: initialDriverPosition.latitude + 0.05, longitude: initialDriverPosition.longitude + 0.05 },
        });
      }
      rideRequestInterval = setInterval(() => {
        const newRide = {
          id: `req_${Date.now()}`,
          pickupAddress: `Partida Aleatória ${Math.floor(Math.random() * 100)}`,
          destinationAddress: `Destino Aleatório ${Math.floor(Math.random() * 1000)}`,
          estimatedFare: (Math.random() * 25 + 10).toFixed(2),
          pickupLocation: {
            latitude: initialDriverPosition.latitude + (Math.random() - 0.5) * 0.1,
            longitude: initialDriverPosition.longitude + (Math.random() - 0.5) * 0.1,
          },
          destinationLocation: { // Não usado no dashboard, mas parte do modelo
            latitude: initialDriverPosition.latitude + (Math.random() - 0.5) * 0.2,
            longitude: initialDriverPosition.longitude + (Math.random() - 0.5) * 0.2,
          },
        };
        simulate_newRideRequest(newRide);
        setSnackbar({ open: true, message: 'Nova solicitação de corrida!', severity: 'info' });
      }, 25000);
    } else {
      if (rideRequestInterval) clearInterval(rideRequestInterval);
      if (clearPendingRides) clearPendingRides();
    }
    return () => clearInterval(rideRequestInterval);
  }, [isOnline, simulate_newRideRequest, clearPendingRides, pendingRides?.length]);

  const handleOnlineToggle = (event) => {
    setIsOnline(event.target.checked);
    if (!event.target.checked) {
      setSnackbar({ open: true, message: 'Você está offline.', severity: 'warning' });
      if (clearPendingRides) clearPendingRides();
    } else {
      setSnackbar({ open: true, message: 'Você está online. Aguardando corridas...', severity: 'success' });
    }
  };

  const handleAcceptRide = async (rideRequest) => {
    if (!simulate_acceptRideByDriver) return;
    setLoading(true);
    try {
      const rideDetailsForAcceptance = {
        ...rideRequest,
        driverCurrentLocation: driverLocation, // driverLocation já é { longitude, latitude }
        driverInfo: { name: user?.name || 'Motorista Padrão', id: user?.id },
        carInfo: { model: user?.vehicleModel || 'Veículo Padrão', plate: user?.vehiclePlate || 'ABC-1234' }
      };
      const acceptedRide = await simulate_acceptRideByDriver(rideDetailsForAcceptance);
      if (acceptedRide) {
        setSnackbar({ open: true, message: `Corrida aceita! ID: ${acceptedRide.id.substring(0,10)}...`, severity: 'success' });
        navigate(`/motorista/navegacao/${acceptedRide.id}`);
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
      setSnackbar({ open: true, message: `Corrida ${rideId.substring(0,10)}... rejeitada.`, severity: 'info' });
    } catch (error) {
      console.error("Erro ao rejeitar corrida:", error);
      setSnackbar({ open: true, message: 'Erro ao rejeitar corrida.', severity: 'error' });
    }
    setLoading(false);
  };
  
  const handleMarkerClick = (ride) => {
    setSelectedRidePopup(ride);
    // Centraliza o mapa no ponto de partida da corrida selecionada
    setViewState(prev => ({
        ...prev,
        longitude: ride.pickupLocation.longitude,
        latitude: ride.pickupLocation.latitude,
        zoom: Math.max(prev.zoom, 15) // Dá um zoom maior
    }));
  };

  return (
    <Container sx={{ py: 2, height: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item><Typography variant="h5" component="h1">Painel do Motorista</Typography></Grid>
          <Grid item>
            <FormControlLabel
              control={<Switch checked={isOnline} onChange={handleOnlineToggle} color="primary" />}
              label={isOnline ? "Online" : "Offline"}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={7} sx={{ height: { xs: '300px', md: 'auto' } }}>
          <Paper elevation={3} sx={{ height: '100%', p: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ml: 1}}>Minha Localização e Solicitações Próximas</Typography>
            <MapboxMap
                ref={mapRef}
                initialViewState={viewState} // Usa o viewState controlado
                onMove={evt => setViewState(evt.viewState)} // Atualiza o viewState ao mover o mapa
                style={{ width: '100%', height: 'calc(100% - 40px)' }}
            >
              {/* Marcador do Motorista */}
              <MapboxMarker longitude={driverLocation.longitude} latitude={driverLocation.latitude} anchor="center">
                <MyLocationIcon color="primary" sx={{ fontSize: 30 }} />
              </MapboxMarker>

              {/* Marcadores para Solicitações de Corrida Pendentes */}
              {isOnline && pendingRides.map(ride => (
                <MapboxMarker
                  key={ride.id}
                  longitude={ride.pickupLocation.longitude}
                  latitude={ride.pickupLocation.latitude}
                  onClick={() => handleMarkerClick(ride)}
                  anchor="bottom"
                >
                  <PersonPinIcon color="secondary" sx={{ fontSize: 30 }} />
                </MapboxMarker>
              ))}

              {/* Popup para a solicitação de corrida selecionada */}
              {selectedRidePopup && (
                <MapboxPopup
                  longitude={selectedRidePopup.pickupLocation.longitude}
                  latitude={selectedRidePopup.pickupLocation.latitude}
                  anchor="bottom"
                  onClose={() => setSelectedRidePopup(null)}
                  closeOnClick={false} // Mantém aberto mesmo com clique no mapa
                  offset={30} // Ajusta o offset para não cobrir o ícone
                >
                  <Typography variant="subtitle2">Corrida para:</Typography>
                  <Typography variant="body2">Partida: {selectedRidePopup.pickupAddress}</Typography>
                  <Typography variant="body2">Destino: {selectedRidePopup.destinationAddress}</Typography>
                  <Typography variant="body1">Ganho: R$ {selectedRidePopup.estimatedFare}</Typography>
                  <Button variant="contained" size="small" color="primary" onClick={() => handleAcceptRide(selectedRidePopup)} sx={{mt:1}}>Aceitar</Button>
                </MapboxPopup>
              )}
            </MapboxMap>
          </Paper>
        </Grid>

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
                      <Card variant="outlined" sx={{ width: '100%', bgcolor: selectedRidePopup?.id === ride.id ? 'action.hover' : 'background.paper' }}>
                        <CardContent onClick={() => handleMarkerClick(ride)} sx={{cursor: 'pointer'}}>
                          <Typography variant="subtitle1" gutterBottom>Nova Solicitação</Typography>
                          <Typography variant="body2"><strong>Partida:</strong> {ride.pickupAddress}</Typography>
                          <Typography variant="body2"><strong>Destino:</strong> {ride.destinationAddress}</Typography>
                          <Typography variant="body1" color="primary" sx={{mt: 1}}>
                            <strong>Ganho Estimado: R$ {ride.estimatedFare}</strong>
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-around' }}>
                          {/* Usar primary para "Aceitar" para alinhar com o botão principal de ação do tema */}
                          <Button variant="contained" color="primary" onClick={() => handleAcceptRide(ride)} disabled={loading}>Aceitar</Button>
                          {/* Manter error para "Rejeitar" pois é uma ação destrutiva/negativa */}
                          <Button variant="outlined" color="error" onClick={() => handleRejectRide(ride.id)} disabled={loading}>Rejeitar</Button>
                        </CardActions>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              ) : (<Typography sx={{textAlign: 'center', mt: 3}}>Nenhuma solicitação no momento. Aguardando...</Typography>)
            ) : (<Typography sx={{textAlign: 'center', mt: 3}}>Você está offline.</Typography>)}
            {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default DriverDashboardPage;
