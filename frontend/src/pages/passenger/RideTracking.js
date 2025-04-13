import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../contexts/SocketContext';
import Chat from '../../components/Chat';
import { toast } from 'react-hot-toast';
import { createBeepSound } from '../../utils/createBeepSound';

const RIDE_STATUS = {
  pending: {
    title: 'Procurando motorista...',
    description: 'Aguarde enquanto encontramos um motorista próximo'
  },
  accepted: {
    title: 'Motorista a caminho',
    description: 'Seu motorista está indo até você'
  },
  collecting: {
    title: 'Motorista chegou!',
    description: 'Seu motorista está aguardando no ponto de encontro'
  },
  in_progress: {
    title: 'Em viagem',
    description: 'Você está a caminho do seu destino'
  },
  completed: {
    title: 'Corrida finalizada',
    description: 'Obrigado por viajar conosco!'
  },
  cancelled: {
    title: 'Corrida cancelada',
    description: 'Esta corrida foi cancelada'
  }
};

const RideTracking = () => {
  const { rideId } = useParams();
  const { socket } = useSocket();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Carregar dados iniciais da corrida
    socket.emit('ride:get', { rideId }, (response) => {
      console.log('Dados iniciais da corrida:', response); // Log para debug
      if (response.error) {
        setError(response.error);
        toast.error('Erro ao carregar dados da corrida');
      } else {
        setRide(response.ride);
      }
      setLoading(false);
    });

    // Ouvir eventos da corrida
    const handleRideUpdate = (updatedRide) => {
      console.log('Atualizando corrida:', updatedRide); // Log para debug
      setRide(updatedRide);
    };

    const handleDriverArrived = (updatedRide) => {
      setRide(updatedRide);
      createBeepSound();
      toast.success('Motorista chegou ao local!');
    };

    const handleRideStarted = (updatedRide) => {
      setRide(updatedRide);
      toast('Iniciando sua viagem!');
    };

    const handleRideCancelled = ({ ride, reason, cancelledBy }) => {
      setRide(ride);
      createBeepSound();
      toast.error(
        cancelledBy === 'driver' 
          ? 'O motorista cancelou a corrida' 
          : 'A corrida foi cancelada',
        { duration: 5000 }
      );
      
      // Redirecionar para home após alguns segundos
      setTimeout(() => {
        navigate('/passenger');
      }, 5000);
    };

    socket.on('ride:updated', handleRideUpdate);
    socket.on('ride:driverArrived', handleDriverArrived);
    socket.on('ride:started', handleRideStarted);
    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('ride:accepted', (response) => {
      console.log('Corrida aceita:', response); // Log para debug
      if (response.ride) {
        setRide(response.ride);
      }
    });

    return () => {
      socket.off('ride:updated', handleRideUpdate);
      socket.off('ride:driverArrived', handleDriverArrived);
      socket.off('ride:started', handleRideStarted);
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('ride:accepted');
    };
  }, [socket, rideId, navigate]);

  useEffect(() => {
    if (!socket || !ride) return;

    const handleDriverLocation = ({ location }) => {
      setDriverLocation(location);
    };

    socket.on('driver:location', handleDriverLocation);

    return () => {
      socket.off('driver:location', handleDriverLocation);
    };
  }, [socket, ride]);

  useEffect(() => {
    if (!driverLocation || !ride) return;

    const calculateRoute = async () => {
      const directionsService = new window.google.maps.DirectionsService();
      try {
        // Se motorista está indo buscar, mostrar rota até origem
        // Se em viagem, mostrar rota até destino
        const destination = ride.status === 'in_progress' 
          ? ride.destination 
          : ride.origin;

        const result = await directionsService.route({
          origin: driverLocation,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        setDirections(result);
      } catch (error) {
        console.error('Erro ao calcular rota:', error);
      }
    };

    calculateRoute();
  }, [driverLocation, ride]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Status da corrida - APENAS PARA O PASSAGEIRO */}
      <div className="bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">
          {RIDE_STATUS[ride?.status]?.title}
        </h2>
        <p className="text-gray-600">
          {RIDE_STATUS[ride?.status]?.description}
        </p>
      </div>

      {/* Debug - mostrar status atual */}
      <div className="p-2 bg-gray-100">
        <p>Status atual: {ride?.status}</p>
      </div>

      {/* Informações do motorista */}
      {ride?.driver && (
        <div className="bg-white mt-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ride.driver.name}</h3>
              <p className="text-sm text-gray-500">
                {ride.driver.vehicle?.model} - {ride.driver.vehicle?.plate}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowChat(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ChatBubbleLeftIcon className="w-6 h-6" />
              </button>
              <a 
                href={`tel:${ride.driver.phone}`}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <PhoneIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {showChat && (
        <Chat
          rideId={ride._id}
          otherUser={ride.driver}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Mapa para acompanhamento */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={driverLocation || ride?.origin}
          zoom={15}
        >
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={{
                url: '/images/car-marker.svg',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
            />
          )}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>
    </div>
  );
};

export default RideTracking; 