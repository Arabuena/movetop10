import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, PhoneIcon, ChatBubbleLeftIcon, HomeIcon, MapIcon, UserIcon, ArrowRightOnRectangleIcon, XMarkIcon, Bars3Icon as MenuIcon } from '@heroicons/react/24/outline';
import Chat from '../../components/Chat';
import { createBeepSound } from '../../utils/createBeepSound';
import { useNavigate } from 'react-router-dom';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 0px)',
  position: 'relative'
};

const defaultCenter = {
  lat: -23.550520,
  lng: -46.633308
};

const libraries = ['places', 'directions'];

const RIDE_STATUS = {
  pending: 'Procurando motorista...',
  accepted: 'Motorista a caminho',
  collecting: 'Motorista chegou ao local',
  in_progress: 'Em viagem',
  completed: 'Finalizada',
  cancelled: 'Cancelada'
};

const PassengerHome = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected, requestRide } = useSocket();
  const [currentRide, setCurrentRide] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rideEstimate, setRideEstimate] = useState(null);
  const [originAutocomplete, setOriginAutocomplete] = useState(null);
  const [destAutocomplete, setDestAutocomplete] = useState(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });
  const [driverLocation, setDriverLocation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [eta, setEta] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    rating: 5.0
  });

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleRideAccepted = (ride) => {
      console.log('Corrida aceita:', ride);
      setCurrentRide(ride);
      setShowNotification(true);
      calculateRoute();
    };

    const handleDriverArrived = (ride) => {
      setCurrentRide(ride);
      createBeepSound();
      if (Notification.permission === 'granted') {
        new Notification('Motorista chegou!', {
          body: 'Seu motorista está aguardando no local de embarque'
        });
      }
    };

    const handleRideStarted = (ride) => {
      setCurrentRide(ride);
      calculateRoute(); // Recalcular rota para o destino
    };

    const handleRideCompleted = (ride) => {
      setCurrentRide(ride);
      setShowRatingModal(true);
    };

    const handleRideCancelled = (ride) => {
      setCurrentRide(ride);
      setError('Corrida cancelada: ' + ride.cancellationReason);
    };

    const handleDriverLocation = (location) => {
      setDriverLocation(location);
    };

    const handleEtaUpdate = (data) => {
      setEta(data.eta);
    };

    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:driverArrived', handleDriverArrived);
    socket.on('ride:started', handleRideStarted);
    socket.on('ride:completed', handleRideCompleted);
    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('driver:location', handleDriverLocation);
    socket.on('driver:eta', handleEtaUpdate);

    return () => {
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:driverArrived', handleDriverArrived);
      socket.off('ride:started', handleRideStarted);
      socket.off('ride:completed', handleRideCompleted);
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('driver:location', handleDriverLocation);
      socket.off('driver:eta', handleEtaUpdate);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setOrigin(currentLocation);
          setCurrentLocation(currentLocation);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        }
      );
    }
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination || !isLoaded) return;

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);
      
      // Calcular estimativa da corrida
      const leg = result.routes[0].legs[0];
      setRideEstimate({
        distance: leg.distance.text,
        duration: leg.duration.text,
        price: calculatePrice(leg.distance.value)
      });

      return result;
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setError('Erro ao calcular rota');
    }
  }, [origin, destination, isLoaded]);

  const handlePlaceSelect = (autocomplete, setLocation) => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      setLocation({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    }
  };

  const handleMapClick = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    if (!origin) {
      setOrigin(location);
    } else if (!destination) {
      setDestination(location);
    }
  };

  const handleRequestRide = async () => {
    if (!socket || !isConnected) {
      setError('Não foi possível conectar ao servidor');
      return;
    }

    if (!origin || !destination) {
      setError('Selecione origem e destino');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const route = await calculateRoute();
      const leg = route.routes[0].legs[0];

      const ride = await requestRide({
        origin: {
          address: leg.start_address,
          lat: origin.lat,
          lng: origin.lng
        },
        destination: {
          address: leg.end_address,
          lat: destination.lat,
          lng: destination.lng
        },
        price: calculatePrice(leg.distance.value),
        distance: leg.distance.value / 1000,
        duration: leg.duration.value / 60,
        paymentMethod: 'credit_card'
      });

      console.log('Corrida solicitada:', ride);
      setCurrentRide(ride);
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      setError(error.message || 'Erro ao solicitar corrida');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (distanceInMeters) => {
    const basePrice = 7;
    const pricePerKm = 2;
    const distanceInKm = distanceInMeters / 1000;
    return basePrice + (distanceInKm * pricePerKm);
  };

  const handleCancelRide = () => {
    if (!currentRide) return;

    socket.emit('ride:cancel', {
      rideId: currentRide._id,
      reason: 'Cancelado pelo passageiro'
    });
  };

  const renderRideStatus = () => {
    if (!currentRide) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {RIDE_STATUS[currentRide.status]}
            </h2>
            {eta && (
              <p className="text-sm text-gray-500">
                Tempo estimado: {Math.round(eta / 60)} minutos
              </p>
            )}
          </div>
          {currentRide.status !== 'in_progress' && (
            <button
              onClick={handleCancelRide}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Cancelar
            </button>
          )}
        </div>

        {currentRide.driver && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Motorista</h3>
              <p className="text-lg text-gray-900">{currentRide.driver.name}</p>
              <div className="flex items-center mt-1">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-gray-600 ml-1">
                  {currentRide.driver.rating || 4.8}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Veículo</h3>
              <p className="text-lg text-gray-900">
                {currentRide.driver.vehicle?.model} - {currentRide.driver.vehicle?.plate}
              </p>
              <p className="text-sm text-gray-500">{currentRide.driver.vehicle?.color}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          {currentRide.driver && (
            <>
              <button
                onClick={() => window.open(`tel:${currentRide.driver.phone}`)}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <PhoneIcon className="h-5 w-5 inline-block mr-2" />
                Ligar
              </button>
              <button
                onClick={() => setShowChat(true)}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <ChatBubbleLeftIcon className="h-5 w-5 inline-block mr-2" />
                Mensagem
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const menuItems = [
    { icon: HomeIcon, text: 'Início', onClick: () => setShowMenu(false) },
    { icon: MapIcon, text: 'Corridas', onClick: () => navigate('/passenger/rides') },
    { icon: UserIcon, text: 'Perfil', onClick: () => navigate('/passenger/profile') },
    { icon: ArrowRightOnRectangleIcon, text: 'Sair', onClick: logout }
  ];

  // Carregar estatísticas
  useEffect(() => {
    if (socket) {
      socket.emit('passenger:getStats', {}, (response) => {
        if (response.success) {
          setStats(response.stats);
        }
      });
    }
  }, [socket]);

  if (!socket || !isConnected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao servidor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Erro ao carregar o mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Menu lateral */}
      <div 
        className={`fixed inset-y-0 left-0 w-80 bg-white shadow-lg transform ${
          showMenu ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="p-4 h-full overflow-y-auto">
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

          {/* Informações do usuário */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Bem-vindo(a)</div>
            <div className="text-lg font-semibold">{user?.name}</div>
          </div>

          {/* Estatísticas */}
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Total de corridas</div>
              <div className="text-xl font-semibold">{stats.totalRides || 0}</div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Avaliação média</div>
              <div className="text-xl font-semibold">{stats.rating || '5.0'} ⭐</div>
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

      {/* Overlay do menu */}
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

      {/* Mapa em tela cheia */}
      <div className="h-screen">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation || defaultCenter}
          zoom={13}
          onClick={handleMapClick}
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
          {origin && (
            <Marker
              position={origin}
              label={{ text: "O", className: "marker-label" }}
            />
          )}
          {destination && (
            <Marker
              position={destination}
              label={{ text: "D", className: "marker-label" }}
            />
          )}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>

      {/* Painel de busca fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl p-4 z-20">
        <div className="max-w-lg mx-auto space-y-4">
          <div>
            <Autocomplete
              onLoad={setOriginAutocomplete}
              onPlaceChanged={() => handlePlaceSelect(originAutocomplete, setOrigin)}
            >
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Origem"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-move-primary focus:border-move-primary"
                />
              </div>
            </Autocomplete>
          </div>

          <div>
            <Autocomplete
              onLoad={setDestAutocomplete}
              onPlaceChanged={() => handlePlaceSelect(destAutocomplete, setDestination)}
            >
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Destino"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-move-primary focus:border-move-primary"
                />
              </div>
            </Autocomplete>
          </div>

          {rideEstimate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Distância</div>
                  <div className="font-medium">{rideEstimate.distance}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tempo</div>
                  <div className="font-medium">{rideEstimate.duration}</div>
                </div>
                <div>
                  <div className="text-gray-500">Valor</div>
                  <div className="font-medium">R$ {rideEstimate.price.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleRequestRide}
            disabled={loading || !origin || !destination}
            className="w-full py-3 px-4 bg-move-primary text-white rounded-lg font-medium disabled:opacity-50 hover:bg-move-primary/90 transition-colors"
          >
            {loading ? 'Solicitando...' : 'Solicitar Corrida'}
          </button>
        </div>
      </div>

      {/* Status da corrida */}
      {currentRide && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl p-4 z-30">
          {renderRideStatus()}
        </div>
      )}

      {/* Chat */}
      {showChat && currentRide?.driver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <Chat
              rideId={currentRide._id}
              otherUser={currentRide.driver}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerHome; 