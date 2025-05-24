import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, CardContent, CircularProgress, Container, Stepper, Step, StepLabel } from '@mui/material'; // Removido Card não usado
import { RideContext } from '../../contexts/RideContext';
import { AuthContext } from '../../contexts/AuthContext';

// Mapbox Imports
import MapboxMap from '../../components/common/MapboxMap';
import { Marker as MapboxMarker, Source, Layer } from 'react-map-gl'; // Removido Popup não usado
import mapboxgl from 'mapbox-gl';

// Material-UI Icons for Markers
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import FmdGoodIcon from '@mui/icons-material/FmdGood';

const rideSteps = ['A caminho do passageiro', 'Embarque', 'Viagem ao destino', 'Corrida finalizada'];

const DriverRideNavigationPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const {
    activeRide,
    driverLocation,
    simulate_updateDriverLocation,
    simulate_driverArrivedAtPickup,
    simulate_tripStartedToDestination,
    simulate_completeRide,
    locationUpdateInterval,
    setLocationUpdateInterval,
  } = useContext(RideContext);
  const { user } = useContext(AuthContext);
  const mapRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [viewState, setViewState] = useState({
    longitude: -46.6333,
    latitude: -23.5505,
    zoom: 12
  });

  // Efeito para simular movimento do motorista
  useEffect(() => {
    if (!activeRide || !activeRide.pickupLocation || !driverLocation) {
        if(locationUpdateInterval) clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
        return;
    }

    let targetLocation; 
    let onArrivalCallback = null;

    if (activeRide.status === 'PICKING_UP') {
      targetLocation = activeRide.pickupLocation;
      setCurrentStep(0);
      onArrivalCallback = () => console.log("Motorista no local de embarque (simulado).");
    } else if (activeRide.status === 'ARRIVED_AT_PICKUP') {
      setCurrentStep(1);
      if (locationUpdateInterval) clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
      return; 
    } else if (activeRide.status === 'IN_PROGRESS') {
      targetLocation = activeRide.destinationLocation;
      setCurrentStep(2);
      onArrivalCallback = () => console.log("Motorista no destino (simulado).");
    } else {
      if (locationUpdateInterval) clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
      if(activeRide.status === 'COMPLETED' || activeRide.status === 'CANCELLED') setCurrentStep(3);
      return;
    }

    if (locationUpdateInterval) clearInterval(locationUpdateInterval);

    const intervalId = setInterval(() => {
      if (!driverLocation || !targetLocation) return; 

      setDriverLocation(prevDriverLoc => {
        const currentLoc = prevDriverLoc || driverLocation; 
        if (!currentLoc) return null;

        const step = 0.00015; 
        let newLongitude = currentLoc.longitude;
        let newLatitude = currentLoc.latitude;

        if (Math.abs(targetLocation.latitude - newLatitude) < step && Math.abs(targetLocation.longitude - newLongitude) < step) {
          clearInterval(intervalId);
          setLocationUpdateInterval(null);
          if (onArrivalCallback) onArrivalCallback();
          const finalLocation = { longitude: targetLocation.longitude, latitude: targetLocation.latitude };
          simulate_updateDriverLocation(finalLocation);
          return finalLocation;
        }

        if (newLatitude < targetLocation.latitude) newLatitude += step;
        else if (newLatitude > targetLocation.latitude) newLatitude -= step;
        if (newLongitude < targetLocation.longitude) newLongitude += step;
        else if (newLongitude > targetLocation.longitude) newLongitude -= step;
        
        const newLocation = { longitude: newLongitude, latitude: newLatitude };
        simulate_updateDriverLocation(newLocation);
        return newLocation;
      });
    }, 2000);
    setLocationUpdateInterval(intervalId);

    return () => { 
      if (locationUpdateInterval) clearInterval(locationUpdateInterval);
      clearInterval(intervalId);
      setLocationUpdateInterval(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRide?.status, activeRide?.id]); 


  // Ajustar o viewport do mapa
 useEffect(() => {
    if (mapRef.current?.getMap && driverLocation && activeRide?.pickupLocation) {
      const mapboxMap = mapRef.current.getMap();
      let pointsToBound = [[driverLocation.longitude, driverLocation.latitude]];

      if (activeRide.status === 'PICKING_UP' && activeRide.pickupLocation) {
        pointsToBound.push([activeRide.pickupLocation.longitude, activeRide.pickupLocation.latitude]);
      } else if (activeRide.status === 'IN_PROGRESS' && activeRide.destinationLocation) {
        pointsToBound.push([activeRide.destinationLocation.longitude, activeRide.destinationLocation.latitude]);
      }
      
      if (pointsToBound.length > 1) {
        const bounds = new mapboxgl.LngLatBounds(pointsToBound[0], pointsToBound[0]);
        pointsToBound.forEach(point => bounds.extend(point));
        try {
          mapboxMap.fitBounds(bounds, { padding: {top: 40, bottom:40, left: 40, right: 40}, maxZoom: 16, duration: 1000 });
        } catch (e) { console.error("Mapbox fitBounds error:", e); }
      } else {
         try {
          mapboxMap.flyTo({ center: pointsToBound[0], zoom: 15, duration: 1000 });
        } catch (e) { console.error("Mapbox flyTo error:", e); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLocation, activeRide?.status, mapRef.current]);


  if (!activeRide || !user || !activeRide.pickupLocation) {
    return (
      <Container sx={{ textAlign: 'center', mt: {xs:2, sm:5}, p:2 }}>
         <Paper elevation={3} sx={{p:3, borderRadius:'12px'}}>
            <Typography variant="h5">Carregando detalhes da corrida...</Typography>
            <Typography variant="body1" sx={{my:2}}>Se a corrida não carregar, ela pode não estar mais ativa.</Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/motorista/dashboard')}>
                Voltar ao Painel
            </Button>
        </Paper>
      </Container>
    );
  }

  const passengerName = activeRide.passengerInfo?.name || 'Passageiro';
  const pickupAddr = `${activeRide.pickupLocation.latitude.toFixed(4)}, ${activeRide.pickupLocation.longitude.toFixed(4)}`;
  const destAddr = activeRide.destinationLocation ? `${activeRide.destinationLocation.latitude.toFixed(4)}, ${activeRide.destinationLocation.longitude.toFixed(4)}` : 'N/A';

  const handleArrivedAtPickup = () => {
    if (simulate_driverArrivedAtPickup) simulate_driverArrivedAtPickup(activeRide.id);
  };

  const handleStartTripToDestination = () => {
    if (simulate_tripStartedToDestination) simulate_tripStartedToDestination(activeRide.id);
  };

  const handleCompleteRide = () => {
    if (simulate_completeRide) {
        simulate_completeRide(activeRide.estimatedPrice); 
        setTimeout(() => navigate('/motorista/dashboard'), 2500); 
    }
  };
  
  useEffect(() => {
    if (!activeRide && rideId) { 
        navigate('/motorista/dashboard');
    }
  }, [activeRide, rideId, navigate]);

  const routeToPickupGeoJson = driverLocation && activeRide.pickupLocation ? {
    type: 'Feature', geometry: { type: 'LineString', coordinates: [[driverLocation.longitude, driverLocation.latitude], [activeRide.pickupLocation.longitude, activeRide.pickupLocation.latitude]] }
  } : null;

  const routeToDestinationGeoJson = driverLocation && activeRide.destinationLocation && (activeRide.status === 'IN_PROGRESS' || activeRide.status === 'ARRIVED_AT_PICKUP') ? {
    type: 'Feature', geometry: { 
        type: 'LineString', 
        coordinates: activeRide.status === 'ARRIVED_AT_PICKUP' ? 
            [[activeRide.pickupLocation.longitude, activeRide.pickupLocation.latitude], [activeRide.destinationLocation.longitude, activeRide.destinationLocation.latitude]] :
            [[driverLocation.longitude, driverLocation.latitude], [activeRide.destinationLocation.longitude, activeRide.destinationLocation.latitude]]
    }
  } : null;

  const buttonSx = { py: 1.2, fontSize: '0.9rem' }; // Consistente com o tema

  return (
    <Container sx={{ py: {xs:1, sm:2}, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' }, mb:1 }}>
        Navegação da Corrida
      </Typography>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Paper elevation={1} sx={{p:1, borderRadius:'8px'}}> {/* Stepper em um Paper suave */}
            <Stepper activeStep={currentStep} alternativeLabel>
            {rideSteps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
            </Stepper>
        </Paper>
      </Box>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={7} lg={8} sx={{ height: {xs: '300px', md:'auto'} }}> {/* Altura responsiva para mapa */}
          <Paper elevation={3} sx={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            {driverLocation && activeRide.pickupLocation && (
              <MapboxMap
                ref={mapRef}
                initialViewState={viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/navigation-day-v1" // Estilo de navegação
              >
                <MapboxMarker longitude={driverLocation.longitude} latitude={driverLocation.latitude} anchor="center">
                  <DirectionsCarIcon sx={{ fontSize: 36, color: (theme) => theme.palette.primary.main }} />
                </MapboxMarker>
                <MapboxMarker longitude={activeRide.pickupLocation.longitude} latitude={activeRide.pickupLocation.latitude} anchor="bottom">
                  <PersonPinIcon sx={{ fontSize: 36, color: (theme) => theme.palette.secondary.main }} />
                </MapboxMarker>
                {activeRide.destinationLocation && (
                  <MapboxMarker longitude={activeRide.destinationLocation.longitude} latitude={activeRide.destinationLocation.latitude} anchor="bottom">
                    <FmdGoodIcon sx={{ fontSize: 36, color: "red" }} />
                  </MapboxMarker>
                )}
                {activeRide.status === 'PICKING_UP' && routeToPickupGeoJson && (
                  <Source id="routeToPickup" type="geojson" data={routeToPickupGeoJson}>
                    <Layer id="routeToPickupLayer" type="line" paint={{ 'line-color': (theme) => theme.palette.secondary.main, 'line-width': 5, 'line-opacity': 0.8 }} />
                  </Source>
                )}
                {(activeRide.status === 'IN_PROGRESS' || activeRide.status === 'ARRIVED_AT_PICKUP') && routeToDestinationGeoJson && (
                  <Source id="routeToDestination" type="geojson" data={routeToDestinationGeoJson}>
                    <Layer id="routeToDestinationLayer" type="line" paint={{ 'line-color': (theme) => theme.palette.primary.main, 'line-width': 6, 'line-opacity': 0.9 }} />
                  </Source>
                )}
              </MapboxMap>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <Paper elevation={3} sx={{ p: {xs:2, sm:2.5}, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Detalhes da Viagem:</Typography>
              <CardContent sx={{p: {xs:0, sm:1}}}> {/* Ajuste de padding no CardContent */}
                <Typography variant="body1">Passageiro: <strong>{passengerName}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Partida: {pickupAddr}</Typography>
                <Typography variant="body2" color="text.secondary">Destino: {destAddr}</Typography>
                <Typography variant="body1" sx={{mt:1}}>Status: <strong style={{color: activeRide.status === 'COMPLETED' ? 'green' : 'inherit'}}>{activeRide.status || 'N/A'}</strong></Typography>
              </CardContent>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, mt:2}}>
              <Button variant="contained" color="primary" fullWidth onClick={handleArrivedAtPickup} disabled={activeRide.status !== 'PICKING_UP'} sx={buttonSx}>
                Cheguei ao Embarque
              </Button>
              <Button variant="contained" color="primary" fullWidth onClick={handleStartTripToDestination} disabled={activeRide.status !== 'ARRIVED_AT_PICKUP'} sx={buttonSx}>
                Iniciar Viagem
              </Button>
              <Button variant="contained" color="primary" fullWidth onClick={handleCompleteRide} disabled={activeRide.status !== 'IN_PROGRESS'} sx={buttonSx}>
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
