import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import logger from '../../../utils/logger';

const Map = ({ center, isOnline }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const defaultCenter = {
    lat: -16.5775095,
    lng: -49.3754792
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
    minZoom: 3,
    maxZoom: 20
  };

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p>Carregando mapa...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center || defaultCenter}
      zoom={15}
      options={mapOptions}
    >
      {center && (
        <Marker
          position={center}
          icon={{
            url: '/images/car-marker.png',
            scaledSize: new window.google.maps.Size(32, 32)
          }}
        />
      )}
    </GoogleMap>
  );
};

export default React.memo(Map); 