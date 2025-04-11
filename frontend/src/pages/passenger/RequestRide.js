import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Autocomplete } from '@react-google-maps/api';
import { useRide } from '../../contexts/RideContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RequestRide = () => {
  const { user } = useAuth();
  const { requestRide, loading, error, setError } = useRide();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  const navigate = useNavigate();

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = currentLocation || {
    lat: -23.550520,
    lng: -46.633308
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Obter endereço da localização atual
          try {
            const address = await getAddressFromCoordinates(location.lat, location.lng);
            setOrigin({
              ...location,
              address
            });
          } catch (error) {
            console.error('Erro ao obter endereço:', error);
            setError('Erro ao obter endereço da localização atual');
          }
          
          setCurrentLocation(location);
        },
        (error) => {
          setError('Erro ao obter localização: ' + error.message);
        }
      );
    } else {
      setError('Geolocalização não é suportada pelo seu navegador');
    }
  }, [setError]);

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setDestination(place.formatted_address);
        setDestinationLocation(location);
      }
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error('Não foi possível obter o endereço'));
          }
        });
      });
      return result;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      throw new Error('Erro ao obter endereço da localização');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!origin || !origin.address) {
        throw new Error('Não foi possível obter o endereço de origem');
      }
      if (!destinationLocation || !destination) {
        throw new Error('Por favor, selecione um destino válido');
      }

      const rideData = {
        passengerId: user.id,
        origin: {
          lat: origin.lat,
          lng: origin.lng,
          address: origin.address
        },
        destination: {
          address: destination,
          location: {
            lat: destinationLocation.lat,
            lng: destinationLocation.lng
          }
        }
      };

      const response = await requestRide(rideData);
      
      if (!response || !response._id) {
        throw new Error('Resposta inválida do servidor');
      }

      navigate(`/rides/${response._id}`);
    } catch (err) {
      console.error('Erro completo:', err);
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Solicitar Corrida</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Seu destino
            </label>
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              restrictions={{ country: 'br' }}
            >
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Para onde você vai?"
                required
              />
            </Autocomplete>
          </div>

          <div className="mb-6">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={13}
              center={center}
            >
              {/* Marcador da origem */}
              {currentLocation && (
                <Marker
                  position={currentLocation}
                  title="Sua localização"
                  label="O"
                />
              )}

              {/* Marcador do destino */}
              {destinationLocation && (
                <Marker
                  position={destinationLocation}
                  title="Destino"
                  label="D"
                />
              )}
            </GoogleMap>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || !origin || !destinationLocation}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Solicitando...' : 'Solicitar Corrida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestRide; 