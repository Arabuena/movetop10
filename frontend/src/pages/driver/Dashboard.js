import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleMap, Marker } from '@react-google-maps/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = currentLocation || {
    lat: -23.550520,  // São Paulo coordinates as default
    lng: -46.633308
  };

  useEffect(() => {
    // Get driver's current location
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          updateDriverLocation(newLocation);
        },
        (error) => {
          setError('Erro ao obter localização: ' + error.message);
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setError('Geolocalização não é suportada pelo seu navegador');
    }
  }, []);

  const updateDriverLocation = async (location) => {
    try {
      const response = await fetch('/api/driver/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
      });
      if (!response.ok) throw new Error('Falha ao atualizar localização');
    } catch (err) {
      console.error('Erro ao atualizar localização:', err);
    }
  };

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/driver/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable: !isAvailable })
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar disponibilidade');
      
      setIsAvailable(!isAvailable);
    } catch (err) {
      setError('Erro ao atualizar disponibilidade: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Dashboard do Motorista</h2>
          <button
            onClick={toggleAvailability}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              isAvailable 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {loading ? 'Atualizando...' : isAvailable ? 'Disponível' : 'Indisponível'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Sua Localização</h3>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={15}
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
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Corridas Hoje</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Avaliação</p>
                <p className="text-2xl font-bold">5.0</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Ganhos Hoje</p>
                <p className="text-2xl font-bold">R$ 0,00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 