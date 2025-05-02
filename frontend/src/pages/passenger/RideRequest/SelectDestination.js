import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';

const SelectDestination = ({ onConfirm, onBack }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  // Detecta a localização atual do usuário
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Converte as coordenadas em um endereço (pode ser ajustado com uma API externa, se quiser)
        setOrigin({
          lat: latitude,
          lng: longitude,
          address: '' // Começa vazio, mas pode ser preenchido após reverso geocoding se quiser
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        // Define um fallback caso não permita geolocalização
        setOrigin({
          lat: -16.6799,
          lng: -49.2556,
          address: 'Localização padrão (Goiânia)'
        });
      }
    );
  }, []);

  const handleOriginChange = (location) => {
    setOrigin(location);
  };

  const handleDestinationChange = (location) => {
    setDestination(location);
  };

  const handleProsseguir = () => {
    if (origin && destination) {
      onConfirm({ origin, destination });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mapa */}
      <div className="w-full h-64 md:h-96">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={destination || origin || { lat: 0, lng: 0 }}
          zoom={13}
        >
          {origin && <Marker position={origin} />}
          {destination && (
            <Marker
              position={destination}
              icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
          )}
        </GoogleMap>
      </div>

      {/* Campos */}
      <div className="p-4 space-y-4 bg-white shadow-md rounded-b-xl">
        <h1 className="text-xl font-semibold text-gray-900">Escolha os endereços</h1>

        {/* Origem */}
        <div>
          <label className="text-sm text-gray-600">Origem</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-3 flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <PlacesAutocomplete
              value={origin?.address || ''}
              onChange={handleOriginChange}
              placeholder="Digite sua localização"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Destino */}
        <div>
          <label className="text-sm text-gray-600">Destino</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-3 flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <PlacesAutocomplete
              value={destination?.address || ''}
              onChange={handleDestinationChange}
              placeholder="Para onde você vai?"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="p-4 bg-white border-t flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleProsseguir}
          disabled={!origin || !destination}
          className={`flex-1 py-3 text-white rounded-lg transition ${
            origin && destination
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Prosseguir
        </button>
      </div>
    </div>
  );
};

export default SelectDestination;
