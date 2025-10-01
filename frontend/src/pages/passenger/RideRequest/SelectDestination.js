import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';
import { useLocation } from '../../../hooks/useLocation';
import LocationError from '../../../components/common/LocationError';

const SelectDestination = ({ onConfirm, onBack }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [directions, setDirections] = useState(null);
  const { location, error: locationError, permissionStatus, requestPermission, locationPrecision } = useLocation();

  // Usa o hook useLocation para obter a localização atual
  useEffect(() => {
    if (location) {
      setOrigin({
        lat: location.latitude,
        lng: location.longitude,
        address: ''
      });
    }
  }, [location]);

  // Calcula a rota quando origem ou destino mudam
  const calculateRoute = useCallback(async () => {
    if (!origin || !destination || !window.google) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      setDirections(result);
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  }, [origin, destination]);

  // Atualiza a rota quando origem ou destino mudam
  useEffect(() => {
    calculateRoute();
  }, [origin, destination, calculateRoute]);

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
      {/* Componente de erro de localização */}
      {locationError && (
        <LocationError 
          error={locationError}
          permissionStatus={permissionStatus}
          onRequestPermission={requestPermission}
          onContinueWithDefault={() => {/* Continuar com localização padrão */}}
        />
      )}
      
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
          {directions && <DirectionsRenderer directions={directions} options={{
            polylineOptions: {
              strokeColor: "#4285F4",
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }} />}
        </GoogleMap>
      </div>

      {/* Campos */}
      <div className="p-4 space-y-4 bg-white shadow-md rounded-b-xl">
        <h1 className="text-xl font-semibold text-gray-900">Escolha os endereços</h1>

        {/* Origem */}
        <div>
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-600">Origem</label>
            {locationPrecision && (
              <div className="flex items-center">
                <span className="text-xs mr-1">Precisão:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  locationPrecision === 'alta' 
                    ? 'bg-green-100 text-green-800' 
                    : locationPrecision === 'média'
                    ? 'bg-yellow-100 text-yellow-800'
                    : locationPrecision === 'baixa'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {locationPrecision === 'alta' 
                    ? 'Alta' 
                    : locationPrecision === 'média'
                    ? 'Média'
                    : locationPrecision === 'baixa'
                    ? 'Baixa'
                    : 'Buscando...'}
                </span>
              </div>
            )}
          </div>
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
