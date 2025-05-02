import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom'; // Para navegar entre telas
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { getRouteBetweenPoints } from './utils'; // Função para obter a rota entre os pontos

const ConfirmRoute = () => {
  const location = useLocation();
  const history = useHistory();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(location.state?.destination || null);
  const [route, setRoute] = useState(null);

  // Função para obter a localização atual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setOrigin({
          lat: latitude,
          lng: longitude,
          address: 'Localização atual', // Pode usar geocodificação para pegar o endereço real
        });
      });
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Função para calcular a rota
  const calculateRoute = (origin, destination) => {
    if (origin && destination) {
      // Aqui, você pode usar a API de rota do Google Maps ou outro serviço para calcular a rota
      getRouteBetweenPoints(origin, destination).then(setRoute);
    }
  };

  // Função chamada quando há alteração na origem ou destino
  const handleOriginChange = (location) => {
    setOrigin(location);
    calculateRoute(location, destination);
  };

  const handleDestinationChange = (location) => {
    setDestination(location);
    calculateRoute(origin, location);
  };

  const handleConfirm = () => {
    // Navegar para a próxima tela de escolha de carros, por exemplo
    history.push('/select-car');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        {/* Mapa */}
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={origin && destination ? { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 } : { lat: -16.6799, lng: -49.2556 }}
          zoom={13}
        >
          {origin && <Marker position={origin} />}
          {destination && <Marker position={destination} />}
          {/* Desenhar a rota */}
          {route && (
            <Polyline
              path={route}
              options={{ strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 2 }}
            />
          )}
        </GoogleMap>
      </div>

      <div className="p-4 bg-white border-t">
        <div className="space-y-4">
          {/* Origem */}
          <div>
            <label className="text-sm text-gray-600">Origem</label>
            <PlacesAutocomplete
              value={origin?.address || ''}
              onChange={handleOriginChange}
              placeholder="De onde você está?"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="text-sm text-gray-600">Destino</label>
            <PlacesAutocomplete
              value={destination?.address || ''}
              onChange={handleDestinationChange}
              placeholder="Para onde você vai?"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => history.goBack()}
            className="flex-1 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!origin || !destination}
            className={`flex-1 py-3 text-white rounded-lg ${origin && destination ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-300'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRoute;
