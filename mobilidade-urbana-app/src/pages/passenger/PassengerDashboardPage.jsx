import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Box, Paper, Typography, TextField, Button, Grid, Snackbar, Container } from '@mui/material'; // Importar Container
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RideContext } from '../../contexts/RideContext'; // Importar RideContext

// Correção para o ícone padrão do marcador do Leaflet não aparecer
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Posição inicial (São Paulo)
const initialPosition = [-23.55052, -46.633308];
const TARIFA_BASE = 5.00;
const TARIFA_KM = 2.50;

function LocationMarker({ position, onPositionChange, label }) {
  const map = useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>{label}</Popup>
    </Marker>
  );
}

const PassengerDashboardPage = () => {
  const [startPoint, setStartPoint] = useState(null); // { lat, lng } ou null
  const [endPoint, setEndPoint] = useState(null); // { lat, lng } ou null
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [route, setRoute] = useState([]);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { simulate_acceptRide } = useContext(RideContext); // Usar o contexto da corrida
  const navigate = useNavigate(); // Hook para navegação

  const handleMapClick = (event) => {
    if (!startPoint) {
      setStartPoint(event.latlng);
      setStartAddress(`Lat: ${event.latlng.lat.toFixed(4)}, Lng: ${event.latlng.lng.toFixed(4)}`);
    } else if (!endPoint) {
      setEndPoint(event.latlng);
      setEndAddress(`Lat: ${event.latlng.lat.toFixed(4)}, Lng: ${event.latlng.lng.toFixed(4)}`);
    }
  };

  const handleShowRouteAndPrice = () => {
    if (startPoint && endPoint) {
      // Simula cálculo de rota (linha reta)
      setRoute([startPoint, endPoint]);

      // Simula cálculo de distância (distância euclidiana simples para demonstração)
      // Em uma aplicação real, usaria um serviço de roteamento para obter a distância real da rota.
      const latDiff = endPoint.lat - startPoint.lat;
      const lngDiff = endPoint.lng - startPoint.lng;
      // Convertendo para uma "distância" aproximada em km (muito simplificado)
      // Este fator de conversão é apenas ilustrativo e não geograficamente preciso.
      const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Aproximação grosseira

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
    if (route.length > 0 && estimatedPrice && startPoint && endPoint) {
      const rideDetails = {
        id: `ride_${Date.now()}`, // ID Simples
        pickupLocation: startPoint, // { lat, lng }
        destinationLocation: endPoint, // { lat, lng }
        startAddress,
        endAddress,
        estimatedPrice,
        routePolyline: route, // Passa a rota desenhada
        // Informações do motorista e carro seriam adicionadas pelo backend/contexto
      };

      const acceptedRide = simulate_acceptRide(rideDetails); // Chama a simulação do contexto

      if (acceptedRide) {
        console.log('Solicitação de corrida aceita (simulada):', acceptedRide);
        setSnackbarMessage(`Sua corrida foi aceita! Motorista a caminho.`);
        setSnackbarOpen(true);
        // Navega para a tela de acompanhamento da corrida
        navigate(`/passageiro/corrida/acompanhar/${acceptedRide.id}`);
      } else {
        // Isso não deveria acontecer com a simulação atual, mas é um bom fallback
        setSnackbarMessage('Não foi possível solicitar a corrida no momento.');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Defina a partida, destino e calcule a rota antes de solicitar.');
      setSnackbarOpen(true);
    }
  };

  // Componente interno para interagir com o mapa e definir pontos
  function ClickHandler() {
    useMapEvents({
      click: handleMapClick,
    });
    return null; // Não renderiza nada visualmente
  }


  return (
    <Box sx={{ py: 2 }}> {/* Alterado para Box para consistência, Container já está no PassengerDashboardContainer */}
      <Typography variant="h4" gutterBottom>
        Painel do Passageiro
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ height: '500px', width: '100%' }}>
            <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={ mapInstance => { /* mapRef.current = mapInstance; */ } }>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ClickHandler /> {/* Adiciona o manipulador de cliques */}
              {startPoint && <Marker position={startPoint}><Popup>Ponto de Partida</Popup></Marker>}
              {endPoint && <Marker position={endPoint}><Popup>Ponto de Destino</Popup></Marker>}
              {route.length > 0 && <Polyline positions={route} color="blue" />}
            </MapContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Controle de Viagem</Typography>
            <TextField
              label="Local de Partida"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              fullWidth
              margin="normal"
              // Aqui poderia adicionar lógica para converter endereço em coordenadas ou vice-versa
              // Por enquanto, é preenchido pelo clique no mapa ou manualmente
            />
            <Typography variant="caption" display="block" gutterBottom>
              {startPoint ? `Lat: ${startPoint.lat.toFixed(4)}, Lng: ${startPoint.lng.toFixed(4)}` : "Clique no mapa para definir a partida"}
            </Typography>

            <TextField
              label="Local de Destino"
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Typography variant="caption" display="block" gutterBottom>
              {endPoint ? `Lat: ${endPoint.lat.toFixed(4)}, Lng: ${endPoint.lng.toFixed(4)}` : "Clique no mapa para definir o destino"}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleShowRouteAndPrice}
              sx={{ mt: 2 }}
              disabled={!startPoint && !endPoint && (!startAddress || !endAddress)} // Habilitar se houver pontos ou endereços
            >
              Ver Rota e Preço
            </Button>

            {estimatedPrice && (
              <Typography variant="h6" sx={{ mt: 2 }}>
                Preço Estimado: R$ {estimatedPrice}
              </Typography>
            )}

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleRequestRide}
              sx={{ mt: 2 }}
              disabled={!route.length || !estimatedPrice}
            >
              Solicitar Corrida
            </Button>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

// Adicionando Container para melhor layout geral da página, similar ao LoginPage
const PassengerDashboardContainer = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: (theme) => theme.palette.background.default, minHeight: 'calc(100vh - 64px)' }}> {/* Container já está aqui */}
      <PassengerDashboardPage />
    </Box>
  );
};

export default PassengerDashboardContainer;
