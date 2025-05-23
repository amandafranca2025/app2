import React, { useEffect, useContext, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Box, Paper, Typography, Button, Grid, Card, CardContent, Avatar, CircularProgress, Container } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext'; // Para informações do usuário/passageiro

// Ícones personalizados
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png', // Exemplo de ícone de carro
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const passengerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1946/1946777.png', // Exemplo de ícone de pessoa
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Correção para o ícone padrão do marcador do Leaflet não aparecer (caso não use ícones personalizados)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TrackRidePage = () => {
  const { rideId } = useParams(); // Embora não usado diretamente para buscar, é bom ter
  const navigate = useNavigate();
  const {
    activeRide,
    driverLocation,
    simulate_updateDriverLocation,
    simulate_cancelRide,
    simulate_startTripToDestination,
    simulate_completeRide, // Importar simulate_completeRide
    locationUpdateInterval,
    setLocationUpdateInterval
  } = useContext(RideContext);
  const { user } = useContext(AuthContext);

  const mapRef = useRef(null);

  // Efeito para simular o movimento do motorista
  useEffect(() => {
    if (activeRide && activeRide.status === 'PICKING_UP' && !locationUpdateInterval) {
      const intervalId = setInterval(() => {
        // Simulação simples de movimento em direção ao passageiro
        // Em uma aplicação real, o backend enviaria essas atualizações via WebSocket
        setDriverLocation(prevLocation => {
          if (!prevLocation || !activeRide.pickupLocation) return prevLocation;

          const targetLat = activeRide.pickupLocation.lat;
          const targetLng = activeRide.pickupLocation.lng;
          const step = 0.0001; // Ajuste o tamanho do passo conforme necessário

          let newLat = prevLocation.lat;
          let newLng = prevLocation.lng;

          if (Math.abs(targetLat - prevLocation.lat) < step && Math.abs(targetLng - prevLocation.lng) < step) {
            // Chegou ao local de partida
            clearInterval(intervalId);
            setLocationUpdateInterval(null);
            simulate_startTripToDestination(); // Muda o status para 'IN_PROGRESS'
            console.log("Motorista chegou ao local de partida.");
            // Poderia iniciar uma nova simulação para o destino aqui
            return prevLocation; // Retorna a localização final (local de partida)
          }

          if (prevLocation.lat < targetLat) newLat += step;
          else if (prevLocation.lat > targetLat) newLat -= step;

          if (prevLocation.lng < targetLng) newLng += step;
          else if (prevLocation.lng > targetLng) newLng -= step;

          simulate_updateDriverLocation({ lat: newLat, lng: newLng });
          return { lat: newLat, lng: newLng };
        });
      }, 2000); // Atualiza a cada 2 segundos
      setLocationUpdateInterval(intervalId);
    } else if (activeRide && activeRide.status === 'IN_PROGRESS' && !locationUpdateInterval) {
      // Simulação de movimento para o destino
       const intervalId = setInterval(() => {
        setDriverLocation(prevLocation => {
          if (!prevLocation || !activeRide.destinationLocation) return prevLocation;

          const targetLat = activeRide.destinationLocation.lat;
          const targetLng = activeRide.destinationLocation.lng;
          const step = 0.0002; // Movimento um pouco mais rápido para o destino

          let newLat = prevLocation.lat;
          let newLng = prevLocation.lng;

           if (Math.abs(targetLat - prevLocation.lat) < step && Math.abs(targetLng - prevLocation.lng) < step) {
            clearInterval(intervalId);
            setLocationUpdateInterval(null);
            console.log("Chegou ao destino!");
            // Adiciona a corrida ao histórico com o preço estimado
            if (activeRide && typeof activeRide.estimatedPrice === 'number') {
              simulate_completeRide(activeRide.estimatedPrice);
            } else if (activeRide) {
              simulate_completeRide(0); // Fallback se o preço não estiver disponível
            }
            // Poderia mostrar um Snackbar/Alerta de "Corrida Concluída" antes de navegar
            // ou mudar o estado da UI para mostrar opções de avaliação, etc.
            // Por simplicidade, vamos apenas logar e o RideContext já trata de limpar activeRide.
            // A navegação pode ser feita no effect que observa activeRide se tornando null.
            return prevLocation;
          }

          if (prevLocation.lat < targetLat) newLat += step;
          else if (prevLocation.lat > targetLat) newLat -= step;

          if (prevLocation.lng < targetLng) newLng += step;
          else if (prevLocation.lng > targetLng) newLng -= step;

          simulate_updateDriverLocation({ lat: newLat, lng: newLng });
          return { lat: newLat, lng: newLng };
        });
      }, 2000);
      setLocationUpdateInterval(intervalId);
    }

    // Limpa o intervalo quando o componente é desmontado ou a corrida termina
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }
    };
  }, [activeRide, simulate_updateDriverLocation, locationUpdateInterval, setLocationUpdateInterval, simulate_startTripToDestination]);


  useEffect(() => {
    // Centralizar o mapa entre o motorista e o passageiro/destino
    if (mapRef.current && driverLocation && activeRide) {
      const passengerLoc = activeRide.status === 'PICKING_UP' ? activeRide.pickupLocation : activeRide.destinationLocation;
      if(passengerLoc) {
        const bounds = L.latLngBounds([
          [driverLocation.lat, driverLocation.lng],
          [passengerLoc.lat, passengerLoc.lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [driverLocation, activeRide, mapRef]);


  // Efeito para navegar para a avaliação ou histórico quando a corrida ativa é limpa
  useEffect(() => {
    if (!activeRide && rideId) {
      // Verifica se há uma corrida para avaliar no contexto E se o ID corresponde
      // Isso é importante para não redirecionar para avaliação de uma corrida antiga se o contexto não foi limpo por algum motivo
      if (activeRide === null && rideToRateDetails && rideToRateDetails.id === rideId) {
        navigate(`/passageiro/avaliar-corrida/${rideId}`);
      } else {
        // Se não há corrida específica para avaliar ou os IDs não batem, vai para o histórico
        navigate('/passageiro/historico-corridas');
      }
    }
  }, [activeRide, rideToRateDetails, navigate, rideId]);


  if (!activeRide) {
    // Se não há corrida ativa, mas ainda estamos nesta página (antes do redirect do useEffect acima)
    // ou se o usuário navegou para cá sem uma corrida ativa.
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h5">Nenhuma corrida ativa no momento.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/passageiro/dashboard')}>
          Solicitar Nova Corrida
        </Button>
      </Container>
    );
  }

  // Se activeRide não for null, prossegue com a renderização normal
  const { driverInfo, carInfo, status, pickupLocation, destinationLocation, routePolyline } = activeRide;

  let statusMessage = "Carregando...";
  if (status === 'PICKING_UP') statusMessage = "Motorista a caminho do local de partida.";
  else if (status === 'IN_PROGRESS') statusMessage = "Em viagem para o destino.";
  else if (status === 'ACCEPTED') statusMessage = "Motorista aceitou sua corrida. Aguardando confirmação..."; // Status inicial
  else if (status === 'COMPLETED') statusMessage = "Corrida finalizada.";
  else if (status === 'CANCELLED') statusMessage = "Corrida cancelada.";


  const handleCancelRide = () => {
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
    }
    simulate_cancelRide();
    navigate('/passageiro/dashboard');
  };

  return (
    <Container sx={{ py: 2, height: 'calc(100vh - 64px - 32px)', display: 'flex', flexDirection: 'column' }}> {/* Subtrai altura da navbar e padding */}
      <Typography variant="h4" gutterBottom>
        Acompanhamento da Corrida
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={8} sx={{ height: '100%'}}>
          <Paper elevation={3} sx={{ height: '100%', width: '100%' }}>
            {driverLocation ? (
              <MapContainer
                ref={mapRef}
                center={driverLocation || pickupLocation || [0,0]} // Fallback se driverLocation for null inicialmente
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Marcador do Motorista */}
                {driverLocation && (
                  <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                    <Popup>Motorista: {driverInfo.name}</Popup>
                  </Marker>
                )}
                {/* Marcador do Ponto de Partida */}
                {pickupLocation && (
                  <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={passengerIcon}>
                    <Popup>Seu local de partida</Popup>
                  </Marker>
                )}
                {/* Marcador do Ponto de Destino */}
                {destinationLocation && (
                  <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
                    <Popup>Seu destino</Popup>
                  </Marker>
                )}
                {/* Rota (ex: do motorista ao passageiro, ou passageiro ao destino) */}
                {routePolyline && routePolyline.length > 0 && (
                  <Polyline positions={routePolyline} color="blue" />
                )}
                {/* Rota simulada do motorista para o passageiro (se status for PICKING_UP) */}
                {status === 'PICKING_UP' && driverLocation && pickupLocation && (
                    <Polyline positions={[[driverLocation.lat, driverLocation.lng], [pickupLocation.lat, pickupLocation.lng]]} color="green" dashArray="5, 5" />
                )}
                {/* Rota simulada do ponto de partida ao destino (se status for IN_PROGRESS) */}
                 {status === 'IN_PROGRESS' && driverLocation && destinationLocation && (
                    <Polyline positions={[[driverLocation.lat, driverLocation.lng], [destinationLocation.lat, destinationLocation.lng]]} color="purple" />
                )}

              </MapContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Carregando mapa e localização do motorista...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Detalhes da Corrida</Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Avatar src={driverInfo.photoUrl || 'https://via.placeholder.com/150'} sx={{ width: 60, height: 60 }} />
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6">{driverInfo.name}</Typography>
                    <Typography variant="body1">Veículo: {carInfo.model}</Typography>
                    <Typography variant="body2">Placa: {carInfo.plate}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Typography variant="subtitle1" gutterBottom>Status: <strong>{statusMessage}</strong></Typography>
            <Typography variant="body2">Partida: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}</Typography>
            <Typography variant="body2">Destino: {destinationLocation.lat.toFixed(4)}, {destinationLocation.lng.toFixed(4)}</Typography>

            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleCancelRide}
              sx={{ mt: 2 }}
              disabled={status === 'COMPLETED' || status === 'CANCELLED'}
            >
              Cancelar Corrida
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TrackRidePage;
