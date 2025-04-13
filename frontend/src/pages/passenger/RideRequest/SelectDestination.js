import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';

const SelectDestination = ({ onConfirm, onBack }) => {
  const [destination, setDestination] = useState(null);
  console.log('Current destination:', destination); // Debug log

  // Origem fixa
  const origin = {
    lat: -16.6799,
    lng: -49.2556,
    address: "CJCF+XH Parque Maracana, Goiânia - GO, Brasil"
  };

  const handleDestinationChange = (location) => {
    console.log('Destination changed:', location); // Debug log
    setDestination(location);
  };

  const handleProsseguir = () => {
    console.log('Prosseguir clicked with destination:', destination); // Debug log
    if (destination) {
      onConfirm({ origin, destination });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Para onde você vai?
        </h1>

        {/* Campos */}
        <div className="space-y-4">
          {/* Origem */}
          <div>
            <label className="text-sm text-gray-600">Origem</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={origin.address}
                readOnly
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          {/* Destino */}
          <div>
            <label className="text-sm text-gray-600">Destino</label>
            <div className="mt-1 relative">
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
      </div>

      {/* Mapa */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={destination || origin}
          zoom={13}
        >
          <Marker position={origin} />
          {destination && (
            <Marker
              position={destination}
              icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
          )}
        </GoogleMap>
      </div>

      {/* Botões */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
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
    </div>
  );
};

export default SelectDestination; 