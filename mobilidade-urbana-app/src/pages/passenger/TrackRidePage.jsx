import React, { useEffect, useContext, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, Card, CardContent, Avatar, CircularProgress, Container } from '@mui/material';
import { RideContext } from '../../contexts/RideContext'; // Removido useRide, não estava sendo usado
import { AuthContext } from '../../contexts/AuthContext';

// Mapbox Imports
import MapboxMap from '../../components/common/MapboxMap';
import { Marker as MapboxMarker, Source, Layer, Popup as MapboxPopup } from 'react-map-gl';
import mapboxgl from 'mapbox-gl'; // Import mapboxgl para LngLatBounds

// Material-UI Icons for Markers
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import FmdGoodIcon from '@mui/icons-material/FmdGood';

const TrackRidePage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const {
    activeRide,
    driverLocation,
    // simulate_updateDriverLocation, // Não é mais usado diretamente aqui, motorista atualiza
    simulate_cancelRide,
    simulate_startTripToDestination,
    simulate_completeRide,
    locationUpdateInterval,
    setLocationUpdateInterval,
    rideToRateDetails,
  } = useContext(RideContext);
  const { user } = useContext(AuthContext);

  const mapRef = useRef(null);

  const [viewState, setViewState] = useState({
    longitude: -46.6333, 
    latitude: -23.5505,
    zoom: 12
  });
  
  const [showDriverPopup, setShowDriverPopup] = useState(false);
  const [showPickupPopup, setShowPickupPopup] = useState(false);
  const [showDestPopup, setShowDestPopup] = useState(false);

  // Efeito para limpar o intervalo se a corrida terminar ou o componente desmontar
  useEffect(() => {
    // A simulação de movimento do motorista agora é feita em DriverRideNavigationPage.
    // Este useEffect apenas garante que, se houver algum intervalo antigo (improvável), ele seja limpo.
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }
    };
  }, [locationUpdateInterval, setLocationUpdateInterval]);

  // Ajustar o viewport do mapa
  useEffect(() => {
    if (driverLocation && activeRide && activeRide.pickupLocation && mapRef.current?.getMap) {
      const mapboxMap = mapRef.current.getMap();
      let points = [[driverLocation.longitude, driverLocation.latitude]];

      if (activeRide.status === 'PICKING_UP' && activeRide.pickupLocation) {
        points.push([activeRide.pickupLocation.longitude, activeRide.pickupLocation.latitude]);
      } else if (activeRide.status === 'IN_PROGRESS' && activeRide.destinationLocation) {
        points.push([activeRide.destinationLocation.longitude, activeRide.destinationLocation.latitude]);
      } else if (activeRide.pickupLocation) {
         points.push([activeRide.pickupLocation.longitude, activeRide.pickupLocation.latitude]);
      }
      
      if (points.length > 1) {
        const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
        points.forEach(point => bounds.extend(point));
        try {
          mapboxMap.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
        } catch (e) { console.error("Mapbox fitBounds error:", e); }
      } else {
         try {
            mapboxMap.flyTo({ center: points[0], zoom: 15, duration: 1000 });
          } catch (e) { console.error("Mapbox flyTo error:", e); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLocation, activeRide?.status, mapRef.current]);


  // Navegação para avaliação ou histórico
  useEffect(() => {
    if (!activeRide && rideId) {
      if (rideToRateDetails && rideToRateDetails.id === rideId) {
        navigate(`/passageiro/avaliar-corrida/${rideId}`);
      } else {
        navigate('/passageiro/historico-corridas');
      }
    }
  }, [activeRide, rideToRateDetails, navigate, rideId]);

  if (!activeRide || !activeRide.pickupLocation) {
    return (
      <Container sx={{ textAlign: 'center', mt: {xs:2, sm:5}, p:2 }}>
        <Paper elevation={3} sx={{p:3, borderRadius:'12px'}}>
            <Typography variant="h5">Carregando detalhes da corrida...</Typography>
            <Typography variant="body1" sx={{my:2}}>Se a corrida não carregar, ela pode não estar mais ativa.</Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/passageiro/dashboard')}>
            Painel Principal
            </Button>
        </Paper>
      </Container>
    );
  }

  const { driverInfo, carInfo, status, pickupLocation, destinationLocation } = activeRide;

  let statusMessage = "Carregando...";
  if (status === 'PICKING_UP') statusMessage = "Motorista a caminho do local de partida.";
  else if (status === 'ARRIVED_AT_PICKUP') statusMessage = "Motorista chegou ao local de embarque.";
  else if (status === 'IN_PROGRESS') statusMessage = "Em viagem para o destino.";
  else if (status === 'COMPLETED') statusMessage = "Corrida finalizada.";
  else if (status === 'CANCELLED') statusMessage = "Corrida cancelada.";
  else if (status === 'ACCEPTED_BY_DRIVER') statusMessage = "Motorista aceitou. A caminho!";

  const handleCancelRide = () => {
    if (locationUpdateInterval) clearInterval(locationUpdateInterval);
    setLocationUpdateInterval(null);
    simulate_cancelRide();
  };

  const routeToPickupGeoJson = driverLocation && pickupLocation ? {
    type: 'Feature', geometry: { type: 'LineString', coordinates: [[driverLocation.longitude, driverLocation.latitude], [pickupLocation.longitude, pickupLocation.latitude]] }
  } : null;
  
  const driverToDestGeoJson = driverLocation && destinationLocation && status === 'IN_PROGRESS' ? {
      type: 'Feature', geometry: { type: 'LineString', coordinates: [[driverLocation.longitude, driverLocation.latitude], [destinationLocation.longitude, destinationLocation.latitude]]}
  } : null;


  return (
    <Container sx={{ py: {xs:1, sm:2}, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}> {/* 64px é a altura da AppBar */}
      <Typography variant="h4" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' }, mb:2 }}>
        Acompanhamento da Corrida
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={7} lg={8} sx={{ height: {xs: '350px', md:'auto'} }}> {/* Altura do mapa responsiva */}
          <Paper elevation={3} sx={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            {activeRide.pickupLocation ? (
              <MapboxMap
                ref={mapRef}
                initialViewState={viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
              >
                {driverLocation && (
                  <MapboxMarker longitude={driverLocation.longitude} latitude={driverLocation.latitude} anchor="center" onClick={() => setShowDriverPopup(true)}>
                    <DirectionsCarIcon sx={{ fontSize: 40, color: (theme) => theme.palette.primary.main }} /> {/* Cor do tema */}
                  </MapboxMarker>
                )}
                 {showDriverPopup && driverLocation && (
                    <MapboxPopup longitude={driverLocation.longitude} latitude={driverLocation.latitude} anchor="bottom" onClose={() => setShowDriverPopup(false)} closeOnClick={false} offset={30}>
                        <Typography variant="subtitle2">Motorista:</Typography>
                        <Typography variant="body2">{driverInfo?.name || 'Aguardando'}</Typography>
                    </MapboxPopup>
                )}
                {pickupLocation && (
                  <MapboxMarker longitude={pickupLocation.longitude} latitude={pickupLocation.latitude} anchor="bottom" onClick={() => setShowPickupPopup(true)}>
                    <PersonPinIcon sx={{ fontSize: 35, color: (theme) => theme.palette.secondary.main }} /> {/* Cor do tema */}
                  </MapboxMarker>
                )}
                {showPickupPopup && pickupLocation && (
                    <MapboxPopup longitude={pickupLocation.longitude} latitude={pickupLocation.latitude} anchor="top" onClose={() => setShowPickupPopup(false)} closeOnClick={false} >
                        <Typography variant="body2">Seu local de partida</Typography>
                    </MapboxPopup>
                )}
                {destinationLocation && (
                  <MapboxMarker longitude={destinationLocation.longitude} latitude={destinationLocation.latitude} anchor="bottom" onClick={() => setShowDestPopup(true)}>
                    <FmdGoodIcon sx={{ fontSize: 35, color: "red" }} /> {/* Mantido vermelho para destino */}
                  </MapboxMarker>
                )}
                {showDestPopup && destinationLocation && (
                    <MapboxPopup longitude={destinationLocation.longitude} latitude={destinationLocation.latitude} anchor="top" onClose={() => setShowDestPopup(false)} closeOnClick={false}>
                        <Typography variant="body2">Seu destino</Typography>
                    </MapboxPopup>
                )}
                {(status === 'PICKING_UP' || status === 'ACCEPTED_BY_DRIVER') && routeToPickupGeoJson && (
                  <Source id="routeToPickup" type="geojson" data={routeToPickupGeoJson}>
                    <Layer id="routeToPickupLayer" type="line" paint={{ 'line-color': (theme) => theme.palette.secondary.main, 'line-width': 4, 'line-dasharray': [2, 2] }} />
                  </Source>
                )}
                {status === 'IN_PROGRESS' && driverToDestGeoJson && (
                  <Source id="routeToDestination" type="geojson" data={driverToDestGeoJson}>
                    <Layer id="routeToDestinationLayer" type="line" paint={{ 'line-color': (theme) => theme.palette.primary.main, 'line-width': 5 }} />
                  </Source>
                )}
              </MapboxMap>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress /> <Typography sx={{ ml: 2 }}>Carregando mapa...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <Paper elevation={3} sx={{ p: {xs:2, sm:3}, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Detalhes da Corrida</Typography>
              {driverInfo && carInfo && (
                <Card sx={{ mb: 2, borderRadius: '10px' /* Já herda do tema, mas pode ser específico */ }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <Avatar src={driverInfo.photoUrl || 'https://via.placeholder.com/80'} sx={{ width: 60, height: 60 }} />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h6">{driverInfo.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{carInfo.model}</Typography>
                        <Typography variant="body2" color="text.secondary">Placa: {carInfo.plate}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              <Typography variant="subtitle1" gutterBottom>Status: <strong style={{color: activeRide.status === 'COMPLETED' ? 'green' : 'inherit'}}>{statusMessage}</strong></Typography>
              {pickupLocation && <Typography variant="body2" color="text.secondary">Partida: {pickupLocation.latitude.toFixed(4)}, {pickupLocation.longitude.toFixed(4)}</Typography>}
              {destinationLocation && <Typography variant="body2" color="text.secondary">Destino: {destinationLocation.latitude.toFixed(4)}, {destinationLocation.longitude.toFixed(4)}</Typography>}
            </Box>
            <Button
              variant="contained"
              color="error" // Mantido error para cancelamento
              fullWidth
              onClick={handleCancelRide}
              sx={{ mt: 2, py: 1.2, fontSize: '0.9rem' }} // Estilo de botão consistente
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
