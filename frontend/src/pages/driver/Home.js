import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const DriverHome = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  // Buscar localização atual e iniciar rastreamento
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        
        // Enviar localização para o servidor
        if (socket) {
          socket.emit('updateDriverLocation', { location });
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        setError('Erro ao obter sua localização');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, isOnline]);

  // Escutar novas corridas disponíveis
  useEffect(() => {
    if (!socket || !isOnline) return;

    socket.on('newRideAvailable', (ride) => {
      setAvailableRides(prev => [...prev, ride]);
    });

    socket.on('rideNoLongerAvailable', (rideId) => {
      setAvailableRides(prev => prev.filter(ride => ride._id !== rideId));
    });

    return () => {
      socket.off('newRideAvailable');
      socket.off('rideNoLongerAvailable');
    };
  }, [socket, isOnline]);

  const handleToggleOnline = async () => {
    try {
      await api.post('/driver/status', { isOnline: !isOnline });
      setIsOnline(!isOnline);
    } catch (error) {
      setError('Erro ao alterar status');
    }
  };

  const handleAcceptRide = async (ride) => {
    try {
      await api.post(`/rides/${ride._id}/accept`);
      navigate(`/driver/rides/${ride._id}`);
    } catch (error) {
      setError('Erro ao aceitar corrida');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mapa */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentLocation || { lat: -23.550520, lng: -46.633308 }}
          zoom={15}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: '/images/car-marker.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          )}

          {/* Marcadores de corridas disponíveis */}
          {isOnline && availableRides.map(ride => (
            <Marker
              key={ride._id}
              position={ride.origin.coordinates}
              onClick={() => setSelectedRide(ride)}
              icon={{
                url: '/images/pickup-marker.png',
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Painel de status */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium">Olá, {user?.name}</h2>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Você está online' : 'Você está offline'}
            </p>
          </div>
          <button
            onClick={handleToggleOnline}
            className={`px-6 py-2 rounded-full font-medium ${
              isOnline
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {isOnline ? 'Ficar offline' : 'Ficar online'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Lista de corridas disponíveis */}
        {isOnline && availableRides.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Corridas disponíveis</h3>
            {availableRides.map(ride => (
              <div
                key={ride._id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">R$ {ride.estimatedPrice}</p>
                    <p className="text-sm text-gray-500">
                      {ride.estimatedDistance.toFixed(1)} km • {ride.estimatedDuration.toFixed(0)} min
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptRide(ride)}
                    className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-500"
                  >
                    Aceitar
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">De:</span> {ride.origin.address}
                  </p>
                  <p>
                    <span className="text-gray-500">Para:</span> {ride.destination.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverHome; 