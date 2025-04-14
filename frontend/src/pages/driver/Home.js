import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Switch } from '@headlessui/react';
import { PhoneIcon, ChatBubbleLeftIcon, MapPinIcon, UserCircleIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Chat from '../../components/Chat';
import { createBeepSound } from '../../utils/createBeepSound';
import { toast } from 'react-hot-toast';
import { withRetry } from '../../utils/socketRetry';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '400px'
};

const libraries = ['places', 'directions'];

const RIDE_STATUS = {
  pending: 'Aguardando motorista',
  accepted: 'A caminho do passageiro',
  in_progress: 'Em andamento',
  completed: 'Finalizada',
  cancelled: 'Cancelada'
};

const DriverHome = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { user } = useAuth();
  const { socket, isConnected, updateDriverStatus, acceptRide } = useSocket();
  const [isAvailable, setIsAvailable] = useState(user?.status === 'available');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);
  const [rideStatus, setRideStatus] = useState('accepted');
  const [eta, setEta] = useState(null);
  const [distanceToPassenger, setDistanceToPassenger] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [stats, setStats] = useState({
    ridesCount: 0,
    earnings: 0,
    onlineTime: 0
  });
  const [onlineTimer, setOnlineTimer] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Atualizar localização do motorista
    if (!isAvailable) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);

        // Se estiver em corrida, enviar localização para o passageiro
        if (currentRide) {
          socket.emit('driver:updateLocation', {
            rideId: currentRide._id,
            location
          });
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.error('Erro ao obter sua localização');
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isAvailable, currentRide, socket]);

  useEffect(() => {
    console.log('DriverHome montado, status:', isAvailable);
  }, []);

  useEffect(() => {
    console.log('Configurando listeners do socket');
    
    if (!socket || !isConnected) {
      console.log('Socket não conectado, pulando configuração');
      return;
    }

    const handleRideRequest = (ride) => {
      // Verificar se temos todos os dados necessários
      if (!ride || !ride.passenger || !ride.passenger.name) {
        console.error('Dados da corrida incompletos:', ride);
        return;
      }

      console.log('Nova solicitação de corrida recebida:', ride);
      if (!isAvailable) {
        console.log('Motorista offline, ignorando solicitação');
        return;
      }
      
      setPendingRide(ride);
      createBeepSound();
      setShowNotification(true);
    };

    const handleRideAccepted = (response) => {
      try {
        console.log('Resposta do aceite:', response);
        
        // Verificar se a resposta é válida
        if (!response || !response.success) {
          throw new Error('Resposta inválida');
        }

        const ride = response.ride;
        
        // Verificar se os dados necessários estão presentes
        if (!ride || !ride.passenger || !ride.passenger.name) {
          throw new Error('Dados da corrida incompletos');
        }

        console.log('Status da corrida:', ride.status);
        setCurrentRide(ride);
        setPendingRide(null);
        setShowNotification(false);
        toast.success('Corrida aceita com sucesso!');

        // Calcular rota inicial
        calculateRoute(ride);
      } catch (error) {
        console.error('Erro ao processar aceite da corrida:', error);
        toast.error('Erro ao aceitar corrida');
        setPendingRide(null);
        setShowNotification(false);
      }
    };

    const handleRideUpdated = (ride) => {
      try {
        console.log('Atualizando corrida:', ride); // Debug
        if (!ride || !ride.passenger || !ride.passenger.name) {
          throw new Error('Dados da corrida incompletos');
        }

        setCurrentRide(ride);
        
        // Recalcular rota se necessário
        if (currentLocation) {
          calculateRoute(ride);
        }
      } catch (error) {
        console.error('Erro ao atualizar corrida:', error);
      }
    };

    const handleRideError = (error) => {
      console.error('Erro na corrida:', error);
      toast.error(error.message || 'Erro ao processar corrida');
      setPendingRide(null);
      setShowNotification(false);
    };

    socket.on('ride:request', handleRideRequest);
    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:updated', handleRideUpdated);
    socket.on('ride:error', handleRideError);

    // Verificar status inicial
    socket.emit('driver:checkStatus', {}, (response) => {
      console.log('Status atual:', response);
      setIsAvailable(response.status === 'available');
    });

    return () => {
      console.log('Removendo listeners do socket');
      socket.off('ride:request', handleRideRequest);
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:updated', handleRideUpdated);
      socket.off('ride:error', handleRideError);
    };
  }, [socket, isConnected, isAvailable, currentLocation]);

  const calculateRoute = useCallback(async (ride) => {
    if (!currentLocation || !isLoaded) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: currentLocation,
        destination: ride.origin,
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  }, [currentLocation, isLoaded]);

  const handleStatusChange = async () => {
    try {
      setLoading(true);
      const newStatus = !isAvailable ? 'available' : 'offline';
      await updateDriverStatus(newStatus);
      setIsAvailable(!isAvailable);
      
      toast.success(`Status alterado para ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRide = () => {
    socket.emit('driver:rejectRide', { rideId: pendingRide._id });
    setPendingRide(null);
    setShowNotification(false);
  };

  const handleAcceptRide = async () => {
    try {
      setLoading(true);
      await acceptRide(pendingRide._id);
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      toast.error('Erro ao aceitar corrida');
      setPendingRide(null);
      setShowNotification(false);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar posição e calcular ETA
  useEffect(() => {
    let watchId;
    if (currentRide && isAvailable) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);

          // Emitir atualização de localização
          socket.emit('driver:location', {
            rideId: currentRide._id,
            location: newLocation
          });

          // Recalcular rota e ETA
          if (rideStatus === 'accepted') {
            await updateRouteToPassenger(newLocation);
          } else if (rideStatus === 'in_progress') {
            await updateRouteToDestination(newLocation);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Erro ao atualizar sua localização');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentRide, rideStatus, isAvailable, calculateRoute]);

  const updateRouteToPassenger = async (driverLocation) => {
    if (!currentRide?.origin) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: driverLocation,
        destination: currentRide.origin,
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);
      setEta(result.routes[0].legs[0].duration.text);
      setDistanceToPassenger(result.routes[0].legs[0].distance.text);

      // Emitir ETA atualizado
      socket.emit('driver:eta', {
        rideId: currentRide._id,
        eta: result.routes[0].legs[0].duration.value
      });
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
    }
  };

  const updateRouteToDestination = async (driverLocation) => {
    if (!currentRide?.destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: driverLocation,
        destination: currentRide.destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);
      setEta(result.routes[0].legs[0].duration.text);
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
    }
  };

  const handleArrived = async () => {
    try {
      console.log('🚗 Motorista chegou ao local de partida');
      setLoading(true);
      
      const response = await new Promise((resolve, reject) => {
        socket.emit('driver:arrived', { rideId: currentRide._id }, (response) => {
          if (response.success) {
            console.log('✅ Status atualizado para: collecting');
            resolve(response);
          } else {
            reject(new Error(response.error || 'Erro ao notificar chegada'));
          }
        });
      });
      
      // Atualizar o estado local com a corrida atualizada
      setCurrentRide(response.ride);
      toast.success('Passageiro notificado da sua chegada');
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao notificar chegada');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    try {
      console.log('🚗 Iniciando corrida');
      setLoading(true);
      
      const response = await new Promise((resolve, reject) => {
        socket.emit('driver:startRide', { rideId: currentRide._id }, (response) => {
          if (response.success) {
            console.log('✅ Status atualizado para: in_progress');
            resolve(response);  // Precisamos da resposta completa
          } else {
            reject(new Error(response.error));
          }
        });
      });
      
      // Atualizar o estado com a corrida atualizada
      setCurrentRide(response.ride);
      toast.success('Corrida iniciada');
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao iniciar corrida');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRide = async () => {
    try {
      console.log('🏁 Finalizando corrida:', currentRide._id);
      setLoading(true);
      
      const response = await new Promise((resolve, reject) => {
        socket.emit('driver:finishRide', { rideId: currentRide._id }, (response) => {
          if (response.success) {
            console.log('✅ Corrida finalizada com sucesso');
            resolve(response);
          } else {
            reject(new Error(response.error || 'Erro ao finalizar corrida'));
          }
        });
      });
      
      setCurrentRide(response.ride);
      toast.success('Corrida finalizada com sucesso!');
      
      // Limpar estado após alguns segundos
      setTimeout(() => {
        setCurrentRide(null);
        setDirections(null);
      }, 5000);

    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao finalizar corrida');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      if (!currentRide) return;
      
      await new Promise((resolve, reject) => {
        socket.emit('ride:cancel', {
          rideId: currentRide._id,
          reason: 'Cancelado pelo motorista'
        }, (response) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error));
          }
        });
      });

      setCurrentRide(null);
      toast.success('Corrida cancelada');
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      toast.error('Erro ao cancelar corrida');
    }
  };

  // Iniciar timer quando ficar online
  useEffect(() => {
    if (isAvailable) {
      const timer = setInterval(() => {
        setStats(prev => ({
          ...prev,
          onlineTime: prev.onlineTime + 1
        }));
      }, 60000); // Atualiza a cada minuto
      setOnlineTimer(timer);
    } else {
      if (onlineTimer) {
        clearInterval(onlineTimer);
      }
    }
    return () => {
      if (onlineTimer) {
        clearInterval(onlineTimer);
      }
    };
  }, [isAvailable]);

  // Formatar tempo online
  const formatOnlineTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // Solicitar permissão para notificações
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Adicionar este useEffect para debug
  useEffect(() => {
    if (currentRide) {
      console.log('Corrida atual:', currentRide);
      console.log('Status da corrida:', currentRide.status);
    }
  }, [currentRide]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRideStatusUpdate = (updatedRide) => {
      console.log('📡 Status da corrida atualizado:', updatedRide.status);
      setCurrentRide(updatedRide);
    };

    socket.on('ride:updated', handleRideStatusUpdate);
    socket.on('ride:driverArrived', handleRideStatusUpdate);

    return () => {
      socket.off('ride:updated', handleRideStatusUpdate);
      socket.off('ride:driverArrived', handleRideStatusUpdate);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    console.log('Status atual da corrida:', currentRide?.status);
  }, [currentRide?.status]);

  if (loadError) {
    return <div>Erro ao carregar o mapa</div>;
  }

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="h-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status do motorista */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 transition-all duration-300 ease-in-out hover:shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Status</h2>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`} />
                <p className={`text-sm ${
                  isAvailable ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {isAvailable ? 'Disponível para corridas' : 'Offline'}
                </p>
              </div>
            </div>
            <Switch
              checked={isAvailable}
              onChange={handleStatusChange}
              disabled={loading || !!currentRide}
              className={`${
                isAvailable ? 'bg-green-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Corridas hoje</p>
                <p className="text-xl font-semibold text-gray-900">{stats.ridesCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ganhos hoje</p>
                <p className="text-xl font-semibold text-gray-900">
                  R$ {stats.earnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tempo online</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatOnlineTime(stats.onlineTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Solicitação de corrida */}
        {showNotification && pendingRide && (
          <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-xl shadow-lg z-50 animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nova corrida disponível!
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Nova
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center">
                  <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-600">
                    {pendingRide.passenger.name}
                  </p>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-600">
                    {pendingRide.origin.address}
                  </p>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-600">
                    R$ {pendingRide.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRejectRide}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Rejeitar
                </button>
                <button
                  onClick={handleAcceptRide}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Aceitar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status da corrida atual */}
        {currentRide && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Cabeçalho com status */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {currentRide.status === 'accepted' && 'Indo buscar passageiro'}
                  {currentRide.status === 'collecting' && 'Aguardando passageiro'}
                  {currentRide.status === 'in_progress' && 'Em viagem'}
                </h2>
                {eta && (
                  <p className="text-sm text-gray-500">
                    Tempo estimado: {eta}
                    {distanceToPassenger && ` • ${distanceToPassenger}`}
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowChat(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                </button>
                <a
                  href={`tel:${currentRide.passenger.phone}`}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <PhoneIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Informações do passageiro e corrida */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Passageiro</h3>
                <p className="text-base text-gray-900">{currentRide.passenger.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Valor</h3>
                <p className="text-base text-gray-900">R$ {currentRide.price.toFixed(2)}</p>
              </div>
            </div>

            {/* Endereços */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ponto de encontro</h3>
                <p className="text-base text-gray-900">{currentRide.origin.address}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Destino</h3>
                <p className="text-base text-gray-900">{currentRide.destination.address}</p>
              </div>
            </div>

            {/* Botões de ação - APENAS PARA O MOTORISTA */}
            <div className="flex gap-2">
              {currentRide.status === 'accepted' && (
                <button
                  onClick={handleArrived}
                  disabled={loading}
                  className="flex-1 py-3 bg-yellow-500 text-white rounded-lg disabled:opacity-50 hover:bg-yellow-600 transition-colors"
                >
                  {loading ? 'Aguarde...' : 'Cheguei ao local'}
                </button>
              )}
              
              {currentRide.status === 'collecting' && (
                <button
                  onClick={handleStartRide}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
                >
                  {loading ? 'Aguarde...' : 'Iniciar corrida'}
                </button>
              )}
              
              {currentRide.status === 'in_progress' && (
                <button
                  onClick={handleFinishRide}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg disabled:opacity-50 hover:bg-green-600"
                >
                  {loading ? 'Aguarde...' : 'Finalizar corrida'}
                </button>
              )}

              {/* Botão de cancelar sempre visível exceto quando em progresso */}
              {currentRide.status !== 'in_progress' && (
                <button
                  onClick={handleCancelRide}
                  disabled={loading}
                  className="py-3 px-6 bg-red-500 text-white rounded-lg disabled:opacity-50 hover:bg-red-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mapa */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Navegação</h2>
          </div>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentLocation}
            zoom={15}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: '/images/car-marker.svg',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />
            )}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: "#E30613",
                    strokeWeight: 5
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>
      </div>

      {/* Chat overlay com animação */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <Chat
              rideId={currentRide._id}
              otherUser={currentRide.passenger}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverHome; 