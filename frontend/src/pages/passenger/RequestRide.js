import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useRide } from '../../hooks/useRide';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RequestRide = () => {
  const { user } = useAuth();
  const { requestRide, loading, error, setError } = useRide();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = currentLocation || {
    lat: -23.550520,  // São Paulo coordinates as default
    lng: -46.633308
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOrigin(location); // Definindo a origem como localização atual
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    } else {
      console.error('Geolocalização não é suportada pelo seu navegador');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin) {
      console.error('Localização de origem não disponível');
      return;
    }
    
    try {
      const ride = await requestRide(origin, destination);
      // Redirecionar para tela de acompanhamento da corrida
      navigate(`/rides/${ride.id}`);
    } catch (err) {
      console.error('Erro ao solicitar corrida:', err);
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
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Para onde você vai?"
              required
            />
          </div>

          <div className="mb-6">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={13}
              center={center}
            >
              {currentLocation && (
                <Marker
                  position={currentLocation}
                  title="Sua localização"
                />
              )}
            </GoogleMap>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || !origin}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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