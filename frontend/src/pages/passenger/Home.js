import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Chat from '../../components/Chat';
import { createBeepSound } from '../../utils/createBeepSound';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '400px'
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
  const { user } = useAuth();
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
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de busca */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Para onde vamos?</h1>
            
            <div className="space-y-4">
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
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-99-primary focus:border-99-primary"
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
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-99-primary focus:border-99-primary"
                    />
                  </div>
                </Autocomplete>
              </div>

              {rideEstimate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Estimativa</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Distância: {rideEstimate.distance}</p>
                    <p>Tempo: {rideEstimate.duration}</p>
                    <p className="text-lg font-medium text-gray-900">
                      Valor: R$ {rideEstimate.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleRequestRide}
                disabled={loading || !origin || !destination}
                className="w-full py-3 px-4 bg-99-primary text-white rounded-lg font-medium disabled:opacity-50 hover:bg-99-primary/90 transition-colors"
              >
                {loading ? 'Solicitando...' : 'Solicitar Corrida'}
              </button>
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={origin || defaultCenter}
                zoom={13}
                onClick={handleMapClick}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false
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
          </div>
        </div>

        {renderRideStatus()}
      </div>

      {showChat && currentRide?.driver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
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