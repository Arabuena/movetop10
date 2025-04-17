import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, Circle, DirectionsRenderer } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';
import { UserIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Chat from '../../../components/Chat';
import { useSocket } from '../../../contexts/SocketContext';
import RideStatus from './RideStatus';

// Adicionar constante RIDE_STATUS
const RIDE_STATUS = {
  pending: 'Procurando motorista...',
  accepted: 'Motorista a caminho',
  collecting: 'Motorista chegou ao local',
  in_progress: 'Em viagem',
  completed: 'Finalizada',
  cancelled: 'Cancelada'
};

const SelectDestination = ({ onConfirm, onBack }) => {
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [driverEta, setDriverEta] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [directions, setDirections] = useState(null);
  const [driverDirections, setDriverDirections] = useState(null);

  // Reduzir ainda mais a precisão aceitável
  const ACCEPTABLE_ACCURACY = 200; // metros - aumentado para 200

  // Configurações mais agressivas para geolocalização
  const geoOptions = {
    enableHighAccuracy: false, // Desabilitar alta precisão para resposta mais rápida
    maximumAge: 30000,        // Aceitar cache de 30 segundos
    timeout: 3000            // Timeout de apenas 3 segundos
  };

  // Adicionar socket context
  const { socket } = useSocket();

  useEffect(() => {
    let timeoutId;
    let watchId;

    const reverseGeocode = async (location) => {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const result = await geocoder.geocode({
          location: { lat: location.lat, lng: location.lng }
        });

        if (result.results[0]) {
          // Atualizar origem mantendo as coordenadas existentes
          setDestination(prev => ({
            ...prev,
            address: result.results[0].formatted_address
          }));
          setIsLoadingAddress(false);
        }
      } catch (error) {
        console.error('Erro no geocoding reverso:', error);
        setIsLoadingAddress(false);
      }
    };

    const getCurrentPosition = () => {
      setIsLoadingLocation(true);
      setIsLoadingAddress(true);

      if (!navigator.geolocation) {
        setLocationError('Geolocalização não suportada');
        setIsLoadingLocation(false);
        setIsLoadingAddress(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          // Atualizar tudo de uma vez
          setCurrentLocation(location);
          setLocationAccuracy(position.coords.accuracy);
          setIsLoadingLocation(false);
          
          // Fazer geocoding sem esperar precisão
          reverseGeocode(location);
        },
        (error) => {
          console.warn('Erro na geolocalização:', error);
          setLocationError('Não foi possível obter sua localização');
          setIsLoadingLocation(false);
          setIsLoadingAddress(false);
        },
        geoOptions
      );
    };

    getCurrentPosition();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Função para calcular ETA do motorista
  const calculateDriverEta = async (driverLocation, passengerLocation) => {
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: driverLocation,
        destination: passengerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      if (result.routes[0]?.legs[0]?.duration) {
        return result.routes[0].legs[0].duration.text;
      }
      return null;
    } catch (error) {
      console.error('Erro ao calcular ETA:', error);
      return null;
    }
  };

  // Ouvir atualizações da corrida
  useEffect(() => {
    if (!socket) return;

    // Ouvir atualizações de status da corrida
    socket.on('ride:updated', (updatedRide) => {
      setCurrentRide(updatedRide);
      
      // Recalcular ETA quando a localização do motorista mudar
      if (updatedRide.status === 'accepted' && updatedRide.driver?.location) {
        calculateDriverEta(
          updatedRide.driver.location,
          destination
        ).then(eta => setDriverEta(eta));
      }
    });

    // Ouvir atualizações de localização do motorista
    socket.on('driver:location', (data) => {
      if (currentRide && data.driverId === currentRide.driver._id) {
        calculateDriverEta(
          data.location,
          destination
        ).then(eta => setDriverEta(eta));
      }
    });

    return () => {
      socket.off('ride:updated');
      socket.off('driver:location');
    };
  }, [socket, destination, currentRide]);

  // Atualizar rota quando origem ou destino mudar
  useEffect(() => {
    if (!currentLocation?.lat || !destination?.lat) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { 
          lat: parseFloat(currentLocation.lat), 
          lng: parseFloat(currentLocation.lng) 
        },
        destination: { 
          lat: parseFloat(destination.lat), 
          lng: parseFloat(destination.lng) 
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          console.log('Directions atualizadas:', result);
          setDirections(result);
        }
      }
    );
  }, [currentLocation?.lat, currentLocation?.lng, destination?.lat, destination?.lng]);

  // Atualizar rota do motorista quando ele aceitar a corrida
  useEffect(() => {
    if (!currentRide?.driver?.location || !currentLocation?.lat) return;
    if (currentRide.status !== 'accepted') {
      setDriverDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { 
          lat: currentRide.driver.location.lat, 
          lng: currentRide.driver.location.lng 
        },
        destination: { lat: currentLocation.lat, lng: currentLocation.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDriverDirections(result);
        } else {
          console.error('Erro ao calcular rota do motorista:', status);
          setDriverDirections(null);
        }
      }
    );
  }, [currentRide?.status, currentRide?.driver?.location, currentLocation]);

  const handleDestinationChange = (place) => {
    console.log('Destination received:', place);
    
    if (!place) {
      console.error('Local não selecionado');
      return;
    }

    // Verificar se já está no formato correto (vindo do PlacesAutocomplete)
    if (typeof place.lat === 'number' && typeof place.lng === 'number') {
      console.log('Destino válido:', place);
      setDestination(place);
      return;
    }

    // Se não estiver no formato correto, tentar converter
    if (place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address
      };
      console.log('Destino convertido:', location);
      setDestination(location);
      return;
    }

    console.error('Formato inválido:', place);
  };

  const handleProsseguir = () => {
    if (!currentLocation?.lat || !currentLocation?.lng || !destination?.lat || !destination?.lng) {
      alert('Por favor, aguarde a localização atual e selecione um destino válido');
      return;
    }

    // Calcular directions antes de prosseguir
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { 
          lat: parseFloat(currentLocation.lat), 
          lng: parseFloat(currentLocation.lng) 
        },
        destination: { 
          lat: parseFloat(destination.lat), 
          lng: parseFloat(destination.lng) 
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          console.log('Directions calculadas com sucesso:', result);
          
          // Passar os dados completos incluindo as directions
          onConfirm({
            origin: {
              lat: parseFloat(currentLocation.lat),
              lng: parseFloat(currentLocation.lng),
              address: currentLocation.address || 'Localização atual'
            },
            destination: {
              lat: parseFloat(destination.lat),
              lng: parseFloat(destination.lng),
              address: destination.address
            },
            directions: result
          });
        } else {
          console.error('Erro ao calcular directions:', status);
          alert('Não foi possível encontrar uma rota para este destino. Por favor, escolha outro destino.');
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {isLoadingLocation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-move-primary mx-auto mb-3"></div>
            <p className="text-gray-600">Ajustando localização...</p>
            {locationAccuracy && (
              <>
                <p className="text-sm text-gray-500">
                  Precisão atual: {Math.round(locationAccuracy)}m
                </p>
                <p className="text-xs text-gray-400">
                  {locationAccuracy > ACCEPTABLE_ACCURACY 
                    ? `Aguardando melhor precisão (meta: ${ACCEPTABLE_ACCURACY}m)`
                    : 'Precisão adequada alcançada!'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mapa em cima */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={destination || currentLocation || { lat: 0, lng: 0 }}
          zoom={currentLocation ? 13 : 2}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }}
        >
          {/* Rota da corrida (origem -> destino) */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#34D399', // Verde
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}

          {/* Rota do motorista até o passageiro */}
          {driverDirections && (
            <DirectionsRenderer
              directions={driverDirections}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#3B82F6', // Azul
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}

          {/* Marcadores personalizados */}
          {currentLocation?.lat && currentLocation?.lng && (
            <Marker 
              position={currentLocation}
              icon={{
                url: '/marker-origin.png', // Você precisará criar este ícone
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          )}
          {destination?.lat && destination?.lng && (
            <Marker
              position={destination}
              icon={{
                url: '/marker-destination.png', // Você precisará criar este ícone
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          )}
          
          {/* Círculo de precisão */}
          {currentLocation?.accuracy && currentLocation?.lat && currentLocation?.lng && (
            <Circle
              center={currentLocation}
              radius={currentLocation.accuracy}
              options={{
                fillColor: '#4285F4',
                fillOpacity: 0.1,
                strokeColor: '#4285F4',
                strokeOpacity: 0.3
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Painel de busca fixo na parte inferior */}
      <div className="bg-white shadow-lg rounded-t-xl p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Para onde você vai?
        </h1>

        {/* Campo de origem - usando PlacesAutocomplete como o destino */}
        <div className="mb-4">
          <div className="mt-1 relative">
            <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <PlacesAutocomplete
              value={currentLocation?.address || ''}
              onChange={(place) => {
                if (place?.lat && place?.lng) {
                  setCurrentLocation({
                    ...currentLocation,
                    lat: place.lat,
                    lng: place.lng,
                    address: place.address
                  });
                }
              }}
              placeholder="Onde você está?"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              onError={(error) => console.error('Erro no autocomplete:', error)}
            />
          </div>
        </div>

        {/* Campo de destino - simplificado */}
        <div>
          <div className="mt-1 relative">
            <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <PlacesAutocomplete
              value=""
              onChange={handleDestinationChange}
              placeholder="Destino"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              onError={(error) => console.error('Erro no autocomplete:', error)}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleProsseguir}
            disabled={!destination}
            className={`flex-1 py-3 text-white rounded-lg ${
              destination 
                ? 'bg-99-primary hover:bg-99-primary/90' 
                : 'bg-gray-300'
            }`}
          >
            Prosseguir
          </button>
        </div>
      </div>

      {/* Chat overlay */}
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

export default SelectDestination; 