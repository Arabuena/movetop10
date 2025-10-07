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

// Função para calcular ETA usando Google Maps Directions API
const calculateETA = (driverLocation, destination) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps não carregado'));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route({
      origin: driverLocation,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (result, status) => {
      if (status === 'OK') {
        const route = result.routes[0];
        const leg = route.legs[0];
        resolve({
          duration: leg.duration.text,
          durationValue: leg.duration.value, // em segundos
          distance: leg.distance.text,
          distanceValue: leg.distance.value // em metros
        });
      } else {
        reject(new Error('Erro ao calcular rota: ' + status));
      }
    });
  });
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
  const [eta, setEta] = useState(null);
  const [loadingEta, setLoadingEta] = useState(false);
  const navigate = useNavigate();

  // Função para cancelar a corrida
  const handleCancelRide = async () => {
    try {
      if (!socket || !ride?._id) {
        toast.error('Erro ao cancelar corrida');
        return;
      }

      const cancelPromise = new Promise((resolve, reject) => {
        socket.emit('passenger:cancelRide', { rideId: ride._id }, (response) => {
          if (response.success) {
            resolve(response);
            // Redirecionar para home após cancelamento
            setTimeout(() => {
              navigate('/passenger');
            }, 2000);
          } else {
            reject(new Error(response.error || 'Erro ao cancelar corrida'));
          }
        });
      });

      await toast.promise(cancelPromise, {
        loading: 'Cancelando corrida...',
        success: 'Corrida cancelada com sucesso!',
        error: (err) => `Erro: ${err.message}`
      });

    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
    }
  };

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
      console.log('Nova localização do motorista recebida:', location);
      if (location && location.lat && location.lng) {
        setDriverLocation(location);
      }
    };

    // Solicitar localização atual do motorista
    if (ride.driver && ride.status !== 'completed' && ride.status !== 'cancelled') {
      socket.emit('passenger:requestDriverLocation', { rideId: ride._id });
    }

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
        // Se o status for 'accepted', o motorista está indo buscar o passageiro
        // Se o status for 'in_progress', o motorista está levando o passageiro ao destino
        const destination = ride.status === 'in_progress' 
          ? { lat: ride.destination.lat, lng: ride.destination.lng } 
          : { lat: ride.origin.lat, lng: ride.origin.lng };

        console.log('Calculando rota:', {
          origem: driverLocation,
          destino: destination,
          status: ride.status
        });

        // Calcular ETA quando o motorista está a caminho (status 'accepted')
        if (ride.status === 'accepted') {
          setLoadingEta(true);
          try {
            const etaData = await calculateETA(driverLocation, destination);
            setEta(etaData);
            console.log('ETA calculado:', etaData);
          } catch (error) {
            console.error('Erro ao calcular ETA:', error);
            setEta(null);
          } finally {
            setLoadingEta(false);
          }
        } else {
          setEta(null);
        }

        const result = await new Promise((resolve, reject) => {
          directionsService.route({
            origin: driverLocation,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          }, (result, status) => {
            if (status === 'OK') {
              resolve(result);
            } else {
              reject(new Error('Erro ao calcular rota: ' + status));
            }
          });
        });

        setDirections(result);
      } catch (error) {
        console.error('Erro ao calcular rota:', error);
        setDirections(null);
      }
    };

    if (window.google && window.google.maps) {
      calculateRoute();
    }
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {RIDE_STATUS[ride?.status]?.title}
            </h2>
            <p className="text-gray-600">
              {RIDE_STATUS[ride?.status]?.description}
            </p>
            
            {/* Exibir ETA quando o motorista está a caminho */}
            {ride?.status === 'accepted' && (
              <div className="mt-2">
                {loadingEta ? (
                  <p className="text-sm text-blue-600">Calculando tempo de chegada...</p>
                ) : eta ? (
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Tempo estimado: {eta.duration}
                    </p>
                    <p className="text-xs text-blue-600">
                      Distância: {eta.distance}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Calculando rota...</p>
                )}
              </div>
            )}
          </div>
          
          {/* Botão de cancelar - apenas para corridas que podem ser canceladas */}
          {(ride?.status === 'pending' || ride?.status === 'accepted') && (
            <button
              onClick={handleCancelRide}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-4"
            >
              Cancelar
            </button>
          )}
        </div>
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
          center={driverLocation || (ride?.origin && { lat: ride.origin.lat, lng: ride.origin.lng })}
          zoom={15}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          {/* Marcador do motorista com animação */}
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={{
                url: '/images/car-marker.svg',
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20)
              }}
              title="Motorista"
            />
          )}
          
          {/* Marcador da origem (posição do passageiro) */}
          {ride?.origin && ride.status !== 'in_progress' && (
            <Marker
              position={{ lat: ride.origin.lat, lng: ride.origin.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
              title="Ponto de partida"
            />
          )}
          
          {/* Marcador do destino */}
          {ride?.destination && (
            <Marker
              position={{ lat: ride.destination.lat, lng: ride.destination.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
              title="Destino"
            />
          )}

          {/* Renderizar rota com cores diferentes baseadas no status */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true, // Usar nossos próprios marcadores
                polylineOptions: {
                  strokeColor: ride?.status === 'in_progress' ? '#10B981' : '#3B82F6', // Verde para em viagem, azul para a caminho
                  strokeWeight: 6,
                  strokeOpacity: 0.8,
                  geodesic: true
                },
                preserveViewport: false
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default RideTracking;