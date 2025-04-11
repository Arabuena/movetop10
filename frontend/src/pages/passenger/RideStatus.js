import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useRide } from '../../contexts/RideContext';
import { useSocket } from '../../contexts/SocketContext';
import RideStatusHeader from '../../components/passenger/RideStatusHeader';
import DriverInfo from '../../components/passenger/DriverInfo';
import RideActions from '../../components/passenger/RideActions';

const RideStatus = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { getRide, currentRide, cancelRide } = useRide();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        await getRide(rideId);
        setLoading(false);
      } catch (error) {
        setError('Erro ao carregar detalhes da corrida');
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId, getRide]);

  useEffect(() => {
    if (!socket || !currentRide) return;

    // Escutar atualizações da corrida
    socket.on('rideUpdate', (updatedRide) => {
      if (updatedRide._id === currentRide._id) {
        getRide(updatedRide._id);
      }
    });

    // Escutar cancelamento da corrida
    socket.on('rideCancelled', (cancelledRide) => {
      if (cancelledRide._id === currentRide._id) {
        navigate('/passenger/home', { 
          state: { message: 'Corrida cancelada pelo motorista' }
        });
      }
    });

    return () => {
      socket.off('rideUpdate');
      socket.off('rideCancelled');
    };
  }, [socket, currentRide, getRide, navigate]);

  const handleCancel = async () => {
    try {
      await cancelRide(rideId, 'Cancelado pelo passageiro');
      navigate('/passenger/home');
    } catch (error) {
      setError('Erro ao cancelar corrida');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !currentRide) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Corrida não encontrada'}</p>
        <button
          onClick={() => navigate('/passenger/home')}
          className="bg-yellow-400 text-white px-4 py-2 rounded-lg"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mapa ocupando a parte superior */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentRide.origin.coordinates}
          zoom={15}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Marcadores e rota */}
          <Marker position={currentRide.origin.coordinates} />
          <Marker position={currentRide.destination.coordinates} />
          {currentRide.driver?.location && (
            <Marker
              position={currentRide.driver.location}
              icon={{
                url: '/images/car-marker.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          )}
          {routeDetails?.path && (
            <Polyline
              path={routeDetails.path}
              options={{
                strokeColor: '#FFB800',
                strokeOpacity: 0.8,
                strokeWeight: 3
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Painel de informações */}
      <div className="bg-white shadow-lg rounded-t-3xl">
        <RideStatusHeader status={currentRide.status} />
        
        {currentRide.driver && (
          <DriverInfo 
            driver={currentRide.driver}
            vehicle={currentRide.vehicle}
          />
        )}

        <RideActions
          ride={currentRide}
          onCancel={handleCancel}
          onChat={() => {/* Implementar chat */}}
          onCall={() => {/* Implementar chamada */}}
          onShare={() => {/* Implementar compartilhamento */}}
        />
      </div>
    </div>
  );
};

export default RideStatus; 