import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Grid, Snackbar } from '@mui/material'; // Removido Container, não usado diretamente aqui
import { RideContext } from '../../contexts/RideContext';

// Mapbox Imports
import MapboxMap from '../../components/common/MapboxMap';
import { Marker as MapboxMarker, Source, Layer } from 'react-map-gl';

// Material-UI Icons for Markers
import FmdGoodIcon from '@mui/icons-material/FmdGood'; // Para pontos de partida/destino
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Alternativa para ponto de partida

// Posição inicial (São Paulo)
const initialPosition = { longitude: -46.633308, latitude: -23.55052 };
const TARIFA_BASE = 5.00;
const TARIFA_KM = 2.50;

const PassengerDashboardPage = () => {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { simulate_acceptRide } = useContext(RideContext);
  const navigate = useNavigate();

  const [viewState, setViewState] = useState({
    ...initialPosition,
    zoom: 11
  });

  const handleMapClick = (event) => {
    const { lngLat } = event;
    const point = { longitude: lngLat.lng, latitude: lngLat.lat };

    if (!startPoint) {
      setStartPoint(point);
      setStartAddress(`Lat: ${point.latitude.toFixed(4)}, Lng: ${point.longitude.toFixed(4)}`);
      setEndPoint(null);
      setEstimatedPrice(null);
    } else if (!endPoint) {
      setEndPoint(point);
      setEndAddress(`Lat: ${point.latitude.toFixed(4)}, Lng: ${point.longitude.toFixed(4)}`);
    }
  };

  const handleShowRouteAndPrice = () => {
    if (startPoint && endPoint) {
      const latDiff = endPoint.latitude - startPoint.latitude;
      const lngDiff = endPoint.longitude - startPoint.longitude;
      const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      const price = TARIFA_BASE + distanceKm * TARIFA_KM;
      setEstimatedPrice(price.toFixed(2));
      setSnackbarMessage(`Rota simulada. Preço estimado: R$ ${price.toFixed(2)}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('Por favor, defina os pontos de partida e destino no mapa ou nos campos.');
      setSnackbarOpen(true);
    }
  };

  const handleRequestRide = () => {
    if (startPoint && endPoint && estimatedPrice) {
      const rideDetails = {
        id: `ride_${Date.now()}`,
        pickupLocation: { lat: startPoint.latitude, lng: startPoint.longitude },
        destinationLocation: { lat: endPoint.latitude, lng: endPoint.longitude },
        startAddress,
        endAddress,
        estimatedPrice: parseFloat(estimatedPrice),
      };
      const acceptedRide = simulate_acceptRide(rideDetails);
      if (acceptedRide) {
        setSnackbarMessage(`Sua corrida foi aceita! Motorista a caminho.`);
        setSnackbarOpen(true);
        navigate(`/passageiro/corrida/acompanhar/${acceptedRide.id}`);
      } else {
        setSnackbarMessage('Não foi possível solicitar a corrida no momento.');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Defina a partida, destino e calcule a rota antes de solicitar.');
      setSnackbarOpen(true);
    }
  };
  
  const routeGeoJson = (start, end) => {
    if (!start || !end) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ]
      }
    };
  };

  const buttonSx = { py: 1.2, fontSize: '0.9rem', mt: 2 }; // Consistente com o tema, mas um pouco menor que auth

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 0 } }}> {/* Ajustado padding para telas menores */}
      <Typography variant="h4" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
        Para Onde Vamos?
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7} lg={8}> {/* Ajustado para dar mais espaço ao mapa em telas grandes */}
          <Paper elevation={3} sx={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}> {/* Adicionado borderRadius e overflow */}
            <MapboxMap
              initialViewState={viewState}
              onMove={evt => setViewState(evt.viewState)}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12" // Estilo de mapa mais recente
            >
              {startPoint && (
                <MapboxMarker longitude={startPoint.longitude} latitude={startPoint.latitude} anchor="bottom">
                  <MyLocationIcon color="primary" sx={{ fontSize: 30 }} />
                </MapboxMarker>
              )}
              {endPoint && (
                <MapboxMarker longitude={endPoint.longitude} latitude={endPoint.latitude} anchor="bottom">
                  <FmdGoodIcon color="secondary" sx={{ fontSize: 30 }} />
                </MapboxMarker>
              )}
              {startPoint && endPoint && (
                <Source id="route" type="geojson" data={routeGeoJson(startPoint, endPoint)}>
                  <Layer
                    id="route-layer"
                    type="line"
                    paint={{
                      'line-color': (theme) => theme.palette.secondary.main, // Usando a cor secundária do tema
                      'line-width': 4, // Linha um pouco mais fina
                      'line-opacity': 0.85
                    }}
                  />
                </Source>
              )}
            </MapboxMap>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5} lg={4}> {/* Ajustado para complementar o mapa */}
          <Paper elevation={3} sx={{ p: {xs: 2, sm: 3}, borderRadius: '12px' }}> {/* Adicionado borderRadius e padding responsivo */}
            <Typography variant="h6" gutterBottom>Controle de Viagem</Typography>
            <TextField
              label="Local de Partida (Clique no mapa)"
              value={startAddress}
              InputProps={{ readOnly: true }}
              fullWidth
              margin="normal"
              variant="outlined" // Alterado para outlined
            />
            <TextField
              label="Local de Destino (Clique no mapa)"
              value={endAddress}
              InputProps={{ readOnly: true }}
              fullWidth
              margin="normal"
              variant="outlined" // Alterado para outlined
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleShowRouteAndPrice}
              sx={buttonSx}
              disabled={!startPoint || !endPoint}
            >
              Ver Rota e Preço
            </Button>
            {estimatedPrice && (
              <Typography variant="h5" sx={{ mt: 2, mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
                R$ {estimatedPrice}
              </Typography>
            )}
            <Button
              variant="contained"
              color="secondary" // Cor secundária para ação principal aqui
              fullWidth
              onClick={handleRequestRide}
              sx={buttonSx}
              disabled={!startPoint || !endPoint || !estimatedPrice}
            >
              Solicitar Corrida
            </Button>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Melhor posicionamento
      />
    </Box>
  );
};

// Container que envolve a página, aplicando fundo e padding geral
const PassengerDashboardContainer = () => {
  return (
    <Box sx={{ flexGrow: 1, p: {xs: 1, sm: 2, md:3}, backgroundColor: (theme) => theme.palette.background.default, minHeight: 'calc(100vh - 64px)' }}>
      <PassengerDashboardPage />
    </Box>
  );
};

export default PassengerDashboardContainer;
