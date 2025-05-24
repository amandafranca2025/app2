import React from 'react';
import ReactMapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Importa o CSS do Mapbox

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapboxMap = ({ initialViewState, style, children, ...props }) => {
  const mapStyle = style || { width: '100%', height: '400px' };
  const defaultInitialViewState = {
    longitude: -46.6333, // São Paulo Longitude
    latitude: -23.5505,  // São Paulo Latitude
    zoom: 10,
    ...initialViewState,
  };

  if (!MAPBOX_TOKEN) {
    console.error("Mapbox token is not configured!");
    return <p>Mapbox token não configurado. Verifique o console.</p>;
  }

  return (
    <ReactMapGL
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={defaultInitialViewState}
      style={mapStyle}
      mapStyle="mapbox://styles/mapbox/streets-v11" // Estilo de mapa padrão, pode ser alterado
      {...props}
    >
      {children}
    </ReactMapGL>
  );
};

export default MapboxMap;
