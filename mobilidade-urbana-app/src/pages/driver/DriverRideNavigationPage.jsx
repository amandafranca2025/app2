import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Box, Paper, Typography, Button, Grid, Card, CardContent, Avatar, CircularProgress, Container, Stepper, Step, StepLabel } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext';

// Ícones personalizados
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png', // Carro
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40],
});
const passengerPickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1946/1946777.png', // Passageiro
  iconSize: [35, 35], iconAnchor: [17, 35], popupAnchor: [0, -35],
});
const destinationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', // Ícone padrão para destino
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Componente para centralizar mapa
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const rideSteps = ['A caminho do passageiro', 'Embarque', 'Viagem ao destino', 'Corrida finalizada'];

const DriverRideNavigationPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const {
    activeRide,
    driverLocation, // Este é o estado que o motorista atualiza
    simulate_updateDriverLocation, // Função para motorista atualizar sua própria localização
    simulate_driverArrivedAtPickup, // Nova função: motorista chegou ao embarque
    simulate_tripStartedToDestination, // Nova função: motorista iniciou viagem ao destino
    simulate_completeRide, // Motorista finaliza a corrida
    locationUpdateInterval,
    setLocationUpdateInterval,
  } = useContext(RideContext);
  const { user } = useContext(AuthContext);
  const mapRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0); // Para o Stepper

  // Efeito para simular movimento do motorista
  useEffect(() => {
    if (!activeRide || !driverLocation) return;

    let targetLocation;
    let onArrival = null;

    if (activeRide.status === 'ACCEPTED_BY_DRIVER' || activeRide.status === 'PICKING_UP') {
      targetLocation = activeRide.pickupLocation;
      onArrival = () => {
        console.log("Motorista chegou ao local de embarque (simulado).");
        // A ação de "Cheguei" será manual pelo botão por enquanto.
        // Se quisesse automático: simulate_driverArrivedAtPickup(activeRide.id);
      };
      setCurrentStep(0);
    } else if (activeRide.status === 'ARRIVED_AT_PICKUP') {
        setCurrentStep(1);
        // Parar simulação de movimento, aguardando "Iniciar Corrida"
        if (locationUpdateInterval) clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
        return; // Não simula mais movimento aqui
    } else if (activeRide.status === 'TRIP_IN_PROGRESS') {
      targetLocation = activeRide.destinationLocation;
      onArrival = () => {
        console.log("Motorista chegou ao destino (simulado).");
        // A ação de "Finalizar Corrida" será manual.
      };
      setCurrentStep(2);
    } else {
        // Corrida completada ou em estado não navegável pelo motorista
        if (locationUpdateInterval) clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
        if(activeRide.status === 'COMPLETED' || activeRide.status === 'CANCELLED') setCurrentStep(3);
        return;
    }

    if (locationUpdateInterval) clearInterval(locationUpdateInterval); // Limpa intervalo anterior

    const intervalId = setInterval(() => {
      setDriverLocation(prevDriverLoc => {
        if (!prevDriverLoc || !targetLocation) return prevDriverLoc;

        const step = 0.00015; // Ajuste o passo da simulação
        let newLat = prevDriverLoc.lat;
        let newLng = prevDriverLoc.lng;

        if (Math.abs(targetLocation.lat - newLat) < step && Math.abs(targetLocation.lng - newLng) < step) {
          clearInterval(intervalId);
          setLocationUpdateInterval(null);
          if (onArrival) onArrival();
          // Mantém a posição no target após chegada
          simulate_updateDriverLocation({ lat: targetLocation.lat, lng: targetLocation.lng });
          return { lat: targetLocation.lat, lng: targetLocation.lng };
        }

        if (newLat < targetLocation.lat) newLat += step;
        else if (newLat > targetLocation.lat) newLat -= step;
        if (newLng < targetLocation.lng) newLng += step;
        else if (newLng > targetLocation.lng) newLng -= step;
        
        const newLocation = { lat: newLat, lng: newLng };
        simulate_updateDriverLocation(newLocation); // Atualiza no contexto
        return newLocation;
      });
    }, 2000);
    setLocationUpdateInterval(intervalId);

    return () => {
      if (locationUpdateInterval) clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRide?.status, activeRide?.id]); // Dependências críticas para reiniciar simulação


  // Ajustar zoom e foco do mapa
  useEffect(() => {
    if (mapRef.current && driverLocation && activeRide) {
      let focusPoint = driverLocation;
      if (activeRide.status === 'ACCEPTED_BY_DRIVER' || activeRide.status === 'PICKING_UP') {
        focusPoint = activeRide.pickupLocation;
      } else if (activeRide.status === 'TRIP_IN_PROGRESS') {
        focusPoint = activeRide.destinationLocation;
      }
      const bounds = L.latLngBounds([driverLocation, focusPoint]);
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [driverLocation, activeRide, mapRef]);


  if (!activeRide || !user) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography>Carregando detalhes da corrida...</Typography>
        <Button onClick={() => navigate('/motorista/dashboard')} sx={{mt:2}}>Voltar ao Painel</Button>
      </Container>
    );
  }

  const passengerName = activeRide.passengerInfo?.name || 'Passageiro';
  const pickupAddr = activeRide.pickupLocation ? `${activeRide.pickupLocation.lat.toFixed(4)}, ${activeRide.pickupLocation.lng.toFixed(4)}` : 'N/A';
  const destAddr = activeRide.destinationLocation ? `${activeRide.destinationLocation.lat.toFixed(4)}, ${activeRide.destinationLocation.lng.toFixed(4)}` : 'N/A';


  const handleArrivedAtPickup = () => {
    if (simulate_driverArrivedAtPickup) simulate_driverArrivedAtPickup(activeRide.id);
    setCurrentStep(1);
  };

  const handleStartTripToDestination = () => {
    if (simulate_tripStartedToDestination) simulate_tripStartedToDestination(activeRide.id);
     setCurrentStep(2);
  };

  const handleCompleteRide = () => {
    if (simulate_completeRide) {
        simulate_completeRide(activeRide.estimatedPrice); // Passa o preço estimado como ganho
        setCurrentStep(3);
        // Navegação para dashboard ou sumário será tratada no useEffect que observa activeRide
        // após simulate_completeRide limpar activeRide e preencher rideToRateDetails.
        // Por ora, vamos apenas permitir que o contexto faça seu trabalho.
        // A navegação para o dashboard pode ser feita após um tempo ou por um botão "Nova Corrida".
        setTimeout(() => navigate('/motorista/dashboard'), 3000); // Volta ao dashboard após 3s
    }
  };
  
  // Efeito para redirecionar se a corrida for completada/cancelada externamente
  useEffect(() => {
    if (!activeRide && rideId) { // Se activeRide ficou null e estávamos numa corrida
        navigate('/motorista/dashboard');
    }
  }, [activeRide, rideId, navigate]);


  return (
    <Container sx={{ py: 2, height: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>Navegação da Corrida (ID: {rideId.substring(0,10)}...)</Typography>
       <Box sx={{ width: '100%', mb: 2 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {rideSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper elevation={3} sx={{ height: '100%', width: '100%' }}>
            {driverLocation && activeRide.pickupLocation && (
              <MapContainer
                ref={mapRef}
                center={driverLocation}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={driverLocation} icon={driverIcon}>
                  <Popup>Você está aqui</Popup>
                </Marker>
                <Marker position={[activeRide.pickupLocation.lat, activeRide.pickupLocation.lng]} icon={passengerPickupIcon}>
                  <Popup>Local de Embarque: {passengerName}</Popup>
                </Marker>
                {activeRide.destinationLocation && (
                  <Marker position={[activeRide.destinationLocation.lat, activeRide.destinationLocation.lng]} icon={destinationIcon}>
                    <Popup>Destino Final</Popup>
                  </Marker>
                )}
                {/* Rota para o Passageiro */}
                {activeRide.status !== 'TRIP_IN_PROGRESS' && activeRide.pickupLocation && driverLocation && (
                  <Polyline positions={[driverLocation, [activeRide.pickupLocation.lat, activeRide.pickupLocation.lng]]} color="blue" />
                )}
                {/* Rota para o Destino */}
                {activeRide.status === 'TRIP_IN_PROGRESS' && activeRide.destinationLocation && driverLocation && (
                  <Polyline positions={[driverLocation, [activeRide.destinationLocation.lat, activeRide.destinationLocation.lng]]} color="purple" />
                )}
              </MapContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Detalhes:</Typography>
              <CardContent>
                <Typography>Passageiro: {passengerName}</Typography>
                <Typography>Partida: {pickupAddr}</Typography>
                <Typography>Destino: {destAddr}</Typography>
                <Typography>Status: {activeRide.status || 'N/A'}</Typography>
              </CardContent>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, mt:2}}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleArrivedAtPickup}
                disabled={!(activeRide.status === 'ACCEPTED_BY_DRIVER' || activeRide.status === 'PICKING_UP')}
              >
                Cheguei ao Local de Embarque
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleStartTripToDestination}
                disabled={activeRide.status !== 'ARRIVED_AT_PICKUP'}
              >
                Iniciar Corrida para Destino
              </Button>
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleCompleteRide}
                disabled={activeRide.status !== 'TRIP_IN_PROGRESS'}
              >
                Finalizar Corrida
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DriverRideNavigationPage;
