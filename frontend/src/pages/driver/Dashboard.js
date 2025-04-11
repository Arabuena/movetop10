import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { driverService } from '../../services/driverService';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useRide } from '../../contexts/RideContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { acceptRide } = useRide();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableRides, setAvailableRides] = useState([]);
  const [showRideAlert, setShowRideAlert] = useState(false);

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = currentLocation || {
    lat: -23.550520,  // São Paulo coordinates as default
    lng: -46.633308
  };

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          
          if (isAvailable) {
            try {
              await driverService.updateLocation(location);
            } catch (error) {
              console.error('Erro ao atualizar localização:', error);
            }
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Erro ao obter localização');
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isAvailable]);

  useEffect(() => {
    const fetchAvailableRides = async () => {
      try {
        const rides = await driverService.getNearbyRides();
        setAvailableRides(rides);
        if (rides.length > 0) {
          setShowRideAlert(true);
        }
      } catch (error) {
        console.error('Erro ao buscar corridas:', error);
      }
    };

    if (isAvailable) {
      const interval = setInterval(fetchAvailableRides, 5000);
      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      await driverService.updateAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      setError('Erro ao atualizar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      setLoading(true);
      await acceptRide(rideId);
      setShowRideAlert(false);
      setAvailableRides(rides => rides.filter(ride => ride._id !== rideId));
    } catch (error) {
      setError('Erro ao aceitar corrida');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRide = (rideId) => {
    setAvailableRides(rides => rides.filter(ride => ride._id !== rideId));
    setShowRideAlert(false);
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

        {/* Alerta de Nova Corrida */}
        {showRideAlert && availableRides.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-2">Nova Corrida Disponível!</h3>
            <div className="mb-3">
              <p>Origem: {availableRides[0].origin.address}</p>
              <p>Destino: {availableRides[0].destination.address}</p>
              <p>Passageiro: {availableRides[0].passenger.name}</p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAcceptRide(availableRides[0]._id)}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Aceitar
              </button>
              <button
                onClick={() => handleRejectRide(availableRides[0]._id)}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Rejeitar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 