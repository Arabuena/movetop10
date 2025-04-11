import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import AddressSearchBar from '../../components/passenger/AddressSearchBar';
import { useAuth } from '../../contexts/AuthContext';

const defaultCenter = {
  lat: -23.550520,
  lng: -46.633308
};

const mapContainerStyle = {
  width: '100%',
  height: '100vh'
};

const PassengerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);

  // Buscar localização atual do usuário
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  const handleOriginSelect = (place) => {
    setOrigin({
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
    });
  };

  const handleDestinationSelect = (place) => {
    setDestination({
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
    });
  };

  const handleRequestRide = () => {
    if (origin && destination) {
      navigate('/passenger/select-vehicle', {
        state: { origin, destination }
      });
    }
  };

  return (
    <div className="relative h-screen">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentLocation}
        zoom={15}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
        {/* Marcador da localização atual */}
        <Marker
          position={currentLocation}
          icon={{
            url: '/images/current-location.png',
            scaledSize: new window.google.maps.Size(30, 30)
          }}
        />

        {/* Marcadores de origem e destino */}
        {origin && (
          <Marker
            position={origin.coordinates}
            icon={{
              url: '/images/origin-marker.png',
              scaledSize: new window.google.maps.Size(30, 30)
            }}
          />
        )}
        {destination && (
          <Marker
            position={destination.coordinates}
            icon={{
              url: '/images/destination-marker.png',
              scaledSize: new window.google.maps.Size(30, 30)
            }}
          />
        )}
      </GoogleMap>

      {/* Painel de busca */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-lg rounded-b-2xl p-4">
        <div className="space-y-4">
          <AddressSearchBar
            placeholder="Para onde vamos?"
            onPlaceSelect={handleDestinationSelect}
            value={destination?.address || ''}
          />
          
          {destination && (
            <AddressSearchBar
              placeholder="Local de partida"
              onPlaceSelect={handleOriginSelect}
              value={origin?.address || ''}
            />
          )}

          {origin && destination && (
            <button
              onClick={handleRequestRide}
              className="w-full bg-yellow-400 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Buscar veículos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerHome; 