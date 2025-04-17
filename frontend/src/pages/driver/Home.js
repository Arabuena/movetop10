import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Switch } from '@headlessui/react';
import { PhoneIcon, ChatBubbleLeftIcon, MapPinIcon, UserCircleIcon, CurrencyDollarIcon, ClockIcon, HomeIcon, MapIcon, ArrowRightOnRectangleIcon, XMarkIcon, Bars3Icon as MenuIcon } from '@heroicons/react/24/outline';
import Chat from '../../components/Chat';
import { createBeepSound } from '../../utils/createBeepSound';
import { toast } from 'react-hot-toast';
import { withRetry } from '../../utils/socketRetry';
import { useNavigate } from 'react-router-dom';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '400px'
};

const defaultCenter = {
  lat: -16.6799,
  lng: -49.2556
};

const libraries = ['places', 'directions'];

const RIDE_STATUS = {
  pending: 'Aguardando motorista',
  accepted: 'A caminho do passageiro',
  collecting: 'No local de partida',
  in_progress: 'Em andamento',
  completed: 'Finalizada'
};

const routeColors = {
  toPassenger: '#4CAF50', // Verde para rota até o passageiro
  toDestination: '#2196F3' // Azul para rota até o destino
};

const RIDE_STAGES = {
  ACCEPTED: 'accepted',        // Motorista aceitou e está a caminho
  ARRIVED: 'arrived',         // Chegou ao local de partida
  IN_PROGRESS: 'in_progress', // Corrida em andamento
  COMPLETED: 'completed'      // Corrida finalizada
};

const DriverHome = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { user, logout } = useAuth();
  const { socket, isConnected, updateDriverStatus, acceptRide } = useSocket();
  const [isAvailable, setIsAvailable] = useState(user?.status === 'online');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [directionsToPassenger, setDirectionsToPassenger] = useState(null);
  const [directionsToDestination, setDirectionsToDestination] = useState(null);
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
  const [onlineTime, setOnlineTime] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rideStage, setRideStage] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      // Configurações da geolocalização
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 20000, // Aumentado para 20 segundos
        maximumAge: 0,
      };

      // Função de sucesso
      const geoSuccess = (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);
        socket?.emit('updateDriverLocation', newLocation);
      };

      // Função de erro
      const geoError = (error) => {
        let errorMessage = 'Erro ao obter sua localização';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao buscar localização';
            // Tentar novamente com precisão menor
            navigator.geolocation.getCurrentPosition(
              geoSuccess,
              (retryError) => console.error('Erro na segunda tentativa:', retryError),
              { ...geoOptions, enableHighAccuracy: false }
            );
            break;
          default:
            errorMessage = 'Erro desconhecido ao obter localização';
        }
        
        console.error('Erro de geolocalização:', error);
        toast.error(errorMessage);
      };

      // Iniciar monitoramento de localização
      const watchId = navigator.geolocation.watchPosition(
        geoSuccess,
        geoError,
        geoOptions
      );

      // Também obter posição inicial imediatamente
      navigator.geolocation.getCurrentPosition(
        geoSuccess,
        geoError,
        geoOptions
      );

      // Cleanup
      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } else {
      toast.error('Seu navegador não suporta geolocalização');
    }
  }, [socket]);

  useEffect(() => {
    console.log('DriverHome montado, status:', isAvailable);
  }, []);

  useEffect(() => {
    console.log('Configurando listeners do socket');
    
    if (!socket || !isConnected) {
      console.log('❌ Socket não conectado');
      return;
    }

    // Log inicial do estado do motorista
    console.log('📍 Estado inicial do motorista:', {
      disponivel: isAvailable,
      socketId: socket?.id,
      temCorrida: !!currentRide,
      localizacao: currentLocation
    });

    // Registrar disponibilidade no servidor
    const registerAvailability = () => {
      if (!currentLocation) {
        console.log('❌ Aguardando localização para registrar disponibilidade');
        return;
      }

      socket.emit('driver:registerAvailability', {
        available: isAvailable,
        location: {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        }
      }, (response) => {
        console.log('📢 Registro de disponibilidade:', {
          sucesso: response?.success,
          status: response?.status,
          erro: response?.error,
          coordenadas: `${currentLocation.lat}, ${currentLocation.lng}`
        });
      });
    };

    // Registrar disponibilidade inicial e quando a localização mudar
    registerAvailability();

    // Atualizar registro quando a localização mudar
    const locationInterval = setInterval(() => {
      if (isAvailable && currentLocation) {
        socket.emit('driver:updateLocation', {
          location: {
            lat: currentLocation.lat,
            lng: currentLocation.lng
          }
        }, (response) => {
          console.log('📍 Localização atualizada:', {
            sucesso: response?.success,
            coordenadas: `${currentLocation.lat}, ${currentLocation.lng}`
          });
        });
      }
    }, 10000); // Atualizar a cada 10 segundos

    const handleRideRequest = (ride) => {
      try {
        console.log('🔔 Nova solicitação recebida:', {
          id: ride._id,
          passageiro: {
            id: ride.passenger?._id,
            nome: ride.passenger?.name
          },
          origem: {
            endereco: ride.origin?.address,
            coordenadas: `${ride.origin?.lat}, ${ride.origin?.lng}`
          },
          destino: {
            endereco: ride.destination?.address,
            coordenadas: `${ride.destination?.lat}, ${ride.destination?.lng}`
          },
          preco: ride.price,
          distancia: `${(ride.distance / 1000).toFixed(1)}km`,
          tempo: `${Math.round(ride.duration / 60)}min`
        });

        // Verificações de disponibilidade
        if (!isAvailable) {
          console.log('❌ Solicitação ignorada - Motorista offline');
          return;
        }

        if (currentRide) {
          console.log('❌ Solicitação ignorada - Motorista em corrida');
          return;
        }

        if (!currentLocation) {
          console.log('❌ Solicitação ignorada - Localização indisponível');
          return;
        }

        // Calcular distância até o passageiro
        const distanceToPassenger = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          ride.origin.lat,
          ride.origin.lng
        );

        console.log('📏 Distância até o passageiro:', {
          distancia: `${distanceToPassenger.toFixed(1)}km`,
          dentroDaArea: distanceToPassenger <= 5 // 5km de raio
        });

        // Tocar som e mostrar notificação
        createBeepSound();
        setRideRequest(ride);

        // Auto-rejeitar após 30 segundos
        const timeoutId = setTimeout(() => {
          console.log('⏰ Tempo esgotado para corrida:', ride._id);
          handleRejectRide(ride._id, 'timeout');
        }, 30000);

        // Guardar ID do timeout para limpeza
        setRideRequest(prev => ({ ...prev, timeoutId }));

      } catch (error) {
        console.error('❌ Erro ao processar solicitação:', error);
      }
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
        calculateRouteToPassenger(ride.origin);
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
          calculateRouteToPassenger(ride.origin);
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

    // Registrar listeners
    console.log('🎧 Registrando listeners do socket');
    socket.on('ride:request', handleRideRequest);
    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:updated', handleRideUpdated);
    socket.on('ride:error', handleRideError);

    // Confirmar registro
    socket.emit('driver:confirmListeners', {}, (response) => {
      console.log('✅ Listeners confirmados:', response);
    });

    return () => {
      console.log('🔄 Limpando listeners e intervalos');
      clearInterval(locationInterval);
      socket.off('ride:request', handleRideRequest);
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:updated', handleRideUpdated);
      socket.off('ride:error', handleRideError);

      // Limpar timeout se existir
      if (rideRequest?.timeoutId) {
        clearTimeout(rideRequest.timeoutId);
      }
    };
  }, [socket, isConnected, isAvailable, currentRide, currentLocation]);

  // Adicionar useEffect para debug do estado do socket
  useEffect(() => {
    if (socket) {
      console.log('Estado do socket:', {
        conectado: socket.connected,
        id: socket.id,
        eventos: socket.hasListeners('ride:request')
      });
    }
  }, [socket?.connected]);

  const calculateRouteToPassenger = useCallback(async (passengerLocation) => {
    if (!currentLocation || !passengerLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: currentLocation,
        destination: passengerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      });
      setDirectionsToPassenger(result);
    } catch (error) {
      console.error('Erro ao calcular rota até o passageiro:', error);
      toast.error('Erro ao calcular rota até o passageiro');
    }
  }, [currentLocation]);

  const calculateRouteToDestination = useCallback(async (destination) => {
    if (!currentLocation || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: currentLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      });
      setDirectionsToDestination(result);
    } catch (error) {
      console.error('Erro ao calcular rota até o destino:', error);
      toast.error('Erro ao calcular rota até o destino');
    }
  }, [currentLocation]);

  // Função para iniciar o timer
  const startOnlineTimer = () => {
    // Limpar timer existente se houver
    if (onlineTimer) {
      clearInterval(onlineTimer);
    }

    // Criar novo timer
    const timer = setInterval(() => {
      setOnlineTime(prev => prev + 1);
    }, 60000); // Atualiza a cada minuto

    setOnlineTimer(timer);
    console.log('🕒 Timer iniciado');
  };

  // Função para parar o timer
  const stopOnlineTimer = () => {
    if (onlineTimer) {
      clearInterval(onlineTimer);
      setOnlineTimer(null);
      console.log('🕒 Timer parado. Tempo online:', formatOnlineTime(onlineTime));
    }
  };

  // Limpar timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (onlineTimer) {
        clearInterval(onlineTimer);
      }
    };
  }, [onlineTimer]);

  // Atualizar stats quando o tempo online mudar
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      onlineTime: onlineTime
    }));
  }, [onlineTime]);

  const handleStatusChange = async (newStatus) => {
    try {
      if (currentRide) {
        toast.error('Não é possível alterar o status durante uma corrida');
        return;
      }

      if (!currentLocation) {
        toast.error('Aguardando sua localização');
        return;
      }

      setStatusLoading(true);
      console.log('🔄 Alterando status do motorista:', {
        de: isAvailable ? 'online' : 'offline',
        para: newStatus ? 'online' : 'offline',
        coordenadas: currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : 'indisponível'
      });

      const response = await new Promise((resolve, reject) => {
        socket.emit('driver:updateStatus', { 
          status: newStatus ? 'online' : 'offline',
          location: currentLocation
        }, (response) => {
          console.log('Resposta do servidor:', response);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        });
      });

      setIsAvailable(newStatus);
      
      if (newStatus) {
        startOnlineTimer();
        toast.success('Você está online!');
      } else {
        stopOnlineTimer();
        toast.success('Você está offline');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
      setIsAvailable(!newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRejectRide = (rideId, reason) => {
    try {
      console.log('❌ Rejeitando corrida:', rideId, 'Motivo:', reason);
      socket.emit('driver:rejectRide', { rideId, reason });
      setRideRequest(null);
    } catch (error) {
      console.error('Erro ao rejeitar corrida:', error);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      console.log('✅ Aceitando corrida:', rideId);
      setLoading(true);

      const response = await new Promise((resolve, reject) => {
        socket.emit('driver:acceptRide', { rideId }, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        });
      });

      console.log('Resposta do aceite:', response);
      setCurrentRide(response.ride);
      setRideRequest(null);
      toast.success('Corrida aceita com sucesso!');

      // Calcular rota inicial
      if (currentLocation && response.ride.origin) {
        calculateRouteToPassenger(response.ride.origin);
      }

    } catch (error) {
      console.error('❌ Erro ao aceitar corrida:', error);
      toast.error('Erro ao aceitar corrida');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (action) => {
    try {
      setActionInProgress(action);
      console.log(`🚗 Atualizando status - Ação: ${action}`);
      
      const response = await new Promise((resolve, reject) => {
        socket.emit(`driver:${action}`, { 
          rideId: currentRide._id 
        }, (response) => {
          console.log('Resposta do servidor:', response);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        });
      });

      if (response.ride) {
        console.log('Novo status:', response.ride.status);
        setCurrentRide(response.ride);
      }

      return response;
    } catch (error) {
      console.error('❌ Erro:', error);
      throw error;
    } finally {
      setActionInProgress(null);
    }
  };

  const handleArrived = async () => {
    try {
      console.log('🚗 Chegada ao local');
      await updateRideStatus('arrived');
      setDirectionsToPassenger(null);
      toast.success('Chegada registrada!');
    } catch (error) {
      toast.error('Erro ao registrar chegada');
    }
  };

  const handleStartRide = async () => {
    try {
      console.log('🚗 Iniciando corrida');
      await updateRideStatus('startRide');
      
      if (currentRide?.destination) {
        calculateRouteToDestination(currentRide.destination);
      }
      
      toast.success('Corrida iniciada!');
    } catch (error) {
      toast.error('Erro ao iniciar corrida');
    }
  };

  const handleFinishRide = async () => {
    try {
      console.log('🏁 Finalizando corrida');
      await updateRideStatus('finishRide');
      toast.success('Corrida finalizada!');
      
      setTimeout(() => {
        setCurrentRide(null);
        setDirectionsToDestination(null);
      }, 5000);
    } catch (error) {
      toast.error('Erro ao finalizar corrida');
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
      console.log('🔄 Atualizando status da corrida:', {
        anterior: currentRide?.status,
        novo: updatedRide.status,
        hora: new Date().toLocaleTimeString()
      });
      
      setCurrentRide(updatedRide);
      
      // Atualizar rotas baseado no novo status
      if (updatedRide.status === 'arrived') {
        setDirectionsToPassenger(null);
      } else if (updatedRide.status === 'in_progress') {
        calculateRouteToDestination(updatedRide.destination);
      }
    };

    socket.on('ride:statusUpdated', handleRideStatusUpdate);
    
    return () => {
      socket.off('ride:statusUpdated', handleRideStatusUpdate);
    };
  }, [socket, isConnected, currentRide?.status, calculateRouteToDestination]);

  useEffect(() => {
    console.log('Status da corrida atualizado:', currentRide?.status);
  }, [currentRide?.status]);

  // Adicionar useEffect para monitorar mudanças no status
  useEffect(() => {
    if (currentRide) {
      console.log('📊 Estado da corrida atualizado:', {
        id: currentRide._id,
        status: currentRide.status,
        horário: new Date().toLocaleTimeString(),
        temRotaPassageiro: !!directionsToPassenger,
        temRotaDestino: !!directionsToDestination
      });
    }
  }, [currentRide?.status, directionsToPassenger, directionsToDestination]);

  // Função auxiliar para calcular distância
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const menuItems = [
    { icon: HomeIcon, text: 'Início', onClick: () => setShowMenu(false) },
    { icon: MapIcon, text: 'Corridas', onClick: () => navigate('/driver/rides') },
    { icon: CurrencyDollarIcon, text: 'Ganhos', onClick: () => navigate('/driver/earnings') },
    { icon: ArrowRightOnRectangleIcon, text: 'Sair', onClick: logout }
  ];

  // Atualizar estatísticas
  const updateStats = useCallback(async () => {
    if (!socket) return;

    socket.emit('driver:getStats', {}, (response) => {
      if (response.success) {
        console.log('Estatísticas recebidas:', response.stats);
        setStats({
          ridesCount: response.stats.totalRides || 0,
          earnings: Number(response.stats.totalEarnings) || 0,
          rating: response.stats.rating || 5
        });
      } else {
        console.error('Erro ao buscar estatísticas:', response.error);
      }
    });
  }, [socket]);

  // Atualizar tempo online
  useEffect(() => {
    let interval;
    
    if (isAvailable) {
      // Iniciar contador quando ficar online
      interval = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
    } else {
      // Resetar contador quando ficar offline
      setOnlineTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAvailable]);

  // Buscar estatísticas iniciais e atualizar periodicamente
  useEffect(() => {
    updateStats();
    
    const statsInterval = setInterval(() => {
      updateStats();
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(statsInterval);
  }, [updateStats]);

  if (loadError) {
    return <div>Erro ao carregar o mapa</div>;
  }

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="relative h-full">
      {/* Menu lateral */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          showMenu ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <button 
              onClick={() => setShowMenu(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Estatísticas */}
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Corridas hoje</div>
              <div className="text-xl font-semibold">{stats.ridesCount}</div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Ganhos hoje</div>
              <div className="text-xl font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(stats.earnings)}
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Tempo online</div>
              <div className="text-xl font-semibold">{formatOnlineTime(onlineTime)}</div>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay para fechar o menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Botão do menu */}
      <button
        onClick={() => setShowMenu(true)}
        className="fixed top-4 left-4 z-30 bg-white p-2 rounded-full shadow-lg"
      >
        <MenuIcon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Conteúdo principal */}
      <div className="h-full">
        {/* Status do motorista */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`} />
                <p className={`text-sm ${
                  isAvailable ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {statusLoading ? 'Atualizando...' : (isAvailable ? 'Online' : 'Offline')}
                </p>
              </div>
            </div>
            <Switch
              checked={isAvailable}
              onChange={handleStatusChange}
              disabled={statusLoading || !!currentRide}
              className={`${
                isAvailable ? 'bg-green-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
            >
              <span className="sr-only">
                {isAvailable ? 'Ficar offline' : 'Ficar online'}
              </span>
              <span
                className={`${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
          
          {/* Mensagem de aviso quando houver corrida em andamento */}
          {currentRide && (
            <p className="mt-2 text-sm text-amber-600">
              Não é possível alterar o status durante uma corrida
            </p>
          )}
        </div>

        {/* Mapa */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-16rem)]">
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%'
            }}
            center={currentLocation || defaultCenter}
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
                  url: '/driver-marker.png',
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
              />
            )}
            {directionsToPassenger && (
              <DirectionsRenderer
                directions={directionsToPassenger}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: routeColors.toPassenger,
                    strokeWeight: 5
                  }
                }}
              />
            )}
            {directionsToDestination && (
              <DirectionsRenderer
                directions={directionsToDestination}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: routeColors.toDestination,
                    strokeWeight: 5
                  }
                }}
              />
            )}
          </GoogleMap>
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

        {/* Notificação de nova corrida */}
        {rideRequest && (
          <div className="fixed inset-x-0 top-4 mx-auto max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-4 m-4 border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Nova solicitação de corrida</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span>{rideRequest.passenger.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {rideRequest.origin.address}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">
                    R$ {rideRequest.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectRide(rideRequest._id, 'rejected by driver')}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Rejeitar
                </button>
                <button
                  onClick={() => handleAcceptRide(rideRequest._id)}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Aceitando...' : 'Aceitar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status da corrida atual */}
        {currentRide && (
          <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Status da Corrida</h3>
            <div className="space-y-4">
              {/* Status atual */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Status: {RIDE_STATUS[currentRide.status]}</span>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleArrived}
                  disabled={actionInProgress || currentRide?.status !== 'accepted'}
                  className={`py-3 px-4 rounded-md font-medium text-white ${
                    currentRide?.status === 'accepted' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                  } disabled:opacity-50`}
                >
                  {actionInProgress === 'arrived' ? 'Aguarde...' : 'Cheguei ao Local'}
                </button>

                <button
                  onClick={handleStartRide}
                  disabled={actionInProgress || currentRide?.status !== 'collecting'}
                  className={`py-3 px-4 rounded-md font-medium text-white ${
                    currentRide?.status === 'collecting' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'
                  } disabled:opacity-50`}
                >
                  {actionInProgress === 'startRide' ? 'Aguarde...' : 'Iniciar Corrida'}
                </button>

                <button
                  onClick={handleFinishRide}
                  disabled={actionInProgress || currentRide?.status !== 'in_progress'}
                  className={`py-3 px-4 rounded-md font-medium text-white ${
                    currentRide?.status === 'in_progress' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400'
                  } disabled:opacity-50`}
                >
                  {actionInProgress === 'finishRide' ? 'Aguarde...' : 'Finalizar Corrida'}
                </button>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default DriverHome; 