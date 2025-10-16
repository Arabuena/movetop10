import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PlacesAutocomplete from '../../../components/PlacesAutocomplete';
import { useLocation } from '../../../hooks/useLocation';
import useAndroidLocation from '../../../hooks/useAndroidLocation';
import LocationError from '../../../components/common/LocationError';
import { toast } from 'react-hot-toast';

const SelectDestination = ({ onConfirm, onBack }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [directions, setDirections] = useState(null);
  const { location, error: locationError, permissionStatus, requestPermission, locationPrecision, readyForMap, mapCountdown, refineLowPrecision, startPrecisionBoost, getCoarseLocation, dismissLocationError } = useLocation();
  const androidLocation = useAndroidLocation();

  const effectivePrecision = React.useMemo(() => {
    const acc = androidLocation?.location?.accuracy;
    if (typeof acc === 'number') {
      if (acc <= 10) return 'alta';
      if (acc <= 100) return 'média';
      return 'baixa';
    }
    return locationPrecision;
  }, [androidLocation?.location?.accuracy, locationPrecision]);

  const effectiveAccuracy = React.useMemo(() => {
    if (typeof androidLocation?.location?.accuracy === 'number') {
      return androidLocation.location.accuracy;
    }
    if (typeof location?.accuracy === 'number') {
      return location.accuracy;
    }
    return null;
  }, [androidLocation?.location?.accuracy, location?.accuracy]);

  const defaultCenter = { lat: -16.6869, lng: -49.2648 };

  // Gating de mapa movido para useLocation (readyForMap/mapCountdown)

  // Usa a localização atual automaticamente APENAS quando a precisão for aceitável
  useEffect(() => {
    if (!location) return;
    const isUsable = (locationPrecision === 'alta' || locationPrecision === 'média') && !location.isDefault;
    if (isUsable) {
      setOrigin(prev => {
        if (prev && prev.address && prev.address.trim()) return prev;
        return {
          lat: location.latitude,
          lng: location.longitude,
          address: ''
        };
      });
    }
  }, [location, locationPrecision]);

  // Preferir localização vinda do Android WebView quando disponível e precisa
  useEffect(() => {
    const loc = androidLocation?.location;
    if (!loc) return;
    const isUsable = typeof loc.accuracy === 'number' && loc.accuracy <= 300;
    if (isUsable) {
      setOrigin(prev => {
        if (prev && prev.lat != null && prev.lng != null) return prev;
        return { lat: loc.lat, lng: loc.lng, address: '' };
      });
    }
  }, [androidLocation?.location]);

  // Calcula a rota quando origem ou destino mudam
  const calculateRoute = useCallback(async () => {
    // Só calcula rota quando houver lat/lng definidos
    if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null || !window.google) return;

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

  const reverseGeocode = async (lat, lng) => {
    if (!window.google || !window.google.maps) return 'Local selecionado no mapa';
    const geocoder = new window.google.maps.Geocoder();
    const result = await new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve('Local selecionado no mapa');
        }
      });
    });
    return result;
  };

  const handleMapClick = async (e) => {
    if (!e || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await reverseGeocode(lat, lng);
    setOrigin({ lat, lng, address });
  };

  const handleOriginDragEnd = async (e) => {
    if (!e || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await reverseGeocode(lat, lng);
    setOrigin({ lat, lng, address });
  };

  const geocodeIfNeeded = async (place) => {
    if (!place) return null;
    // Se já tiver lat/lng, retorna como está
    if (place.lat != null && place.lng != null) return place;
    if (!window.google || !window.google.maps) return null;
    if (!place.address || !place.address.trim()) return null;
    const geocoder = new window.google.maps.Geocoder();
    const result = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: place.address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng(), address: results[0].formatted_address });
        } else {
          resolve(null);
        }
      });
    });
    return result;
  };

  const handleProsseguir = async () => {
    if (!origin || !destination) return;
    // Garantir que ambos tenham coordenadas (geocodificando se necessário)
    const resolvedOrigin = await geocodeIfNeeded(origin);
    const resolvedDestination = await geocodeIfNeeded(destination);
    if (resolvedOrigin && resolvedDestination) {
      setOrigin(resolvedOrigin);
      setDestination(resolvedDestination);
      onConfirm({ origin: resolvedOrigin, destination: resolvedDestination });
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
          onContinueWithDefault={async () => {
            try {
              const coarse = await getCoarseLocation();
              if (coarse && typeof coarse.latitude === 'number' && typeof coarse.longitude === 'number') {
                setOrigin({ lat: coarse.latitude, lng: coarse.longitude, address: '' });
                toast('Localização aproximada aplicada.', { icon: '🗺️' });
                dismissLocationError();
              } else {
                toast('Não foi possível obter localização aproximada.', { icon: '⚠️' });
              }
            } catch (e) {
              console.warn('Falha ao obter localização aproximada:', e);
              toast('Erro ao obter localização aproximada.', { icon: '⚠️' });
            }
          }}
        />
      )}
      
      {/* Mapa */}
      <div className="w-full h-64 md:h-96">
        {readyForMap ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={
              (destination?.lat != null && destination?.lng != null)
                ? { lat: destination.lat, lng: destination.lng }
                : (origin?.lat != null && origin?.lng != null)
                ? { lat: origin.lat, lng: origin.lng }
                : (androidLocation?.location?.lat != null && androidLocation?.location?.lng != null && (androidLocation?.location?.accuracy ?? 1000) <= 300)
                ? { lat: androidLocation.location.lat, lng: androidLocation.location.lng }
                : (location?.latitude != null && location?.longitude != null && (locationPrecision === 'alta' || locationPrecision === 'média') && !location.isDefault)
                ? { lat: location.latitude, lng: location.longitude }
                : defaultCenter
            }
            zoom={13}
            onClick={handleMapClick}
          >
            {origin?.lat != null && origin?.lng != null && (
              <Marker 
                position={{ lat: origin.lat, lng: origin.lng }} 
                draggable 
                onDragEnd={handleOriginDragEnd}
              />
            )}
            {destination?.lat != null && destination?.lng != null && (
              <Marker
                position={{ lat: destination.lat, lng: destination.lng }}
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
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center px-4">
              <p className="text-lg font-semibold text-gray-800">Aguardando GPS estabilizar</p>
              <p className="mt-1 text-sm text-gray-600">Carregando mapa em {Math.max(mapCountdown, 0)}s</p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  effectivePrecision === 'alta'
                    ? 'bg-green-100 text-green-800'
                    : effectivePrecision === 'média'
                    ? 'bg-yellow-100 text-yellow-800'
                    : effectivePrecision === 'baixa'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  Precisão atual: {
                    effectivePrecision === 'alta'
                      ? 'Alta'
                      : effectivePrecision === 'média'
                      ? 'Média'
                      : effectivePrecision === 'baixa'
                      ? 'Baixa'
                      : 'Buscando...'
                  }
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Aguarde 60s para melhorar a precisão antes de abrir o mapa.</p>
              {typeof effectiveAccuracy === 'number' && (
                <p className="mt-1 text-xs text-gray-500">Leitura atual: ±{Math.round(effectiveAccuracy)}m</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Campos */}
      <div className="p-4 space-y-4 bg-white shadow-md rounded-b-xl">
        <h1 className="text-xl font-semibold text-gray-900">Escolha os endereços</h1>

        {/* Origem */}
        <div>
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-600">Origem</label>
            <div className="flex items-center gap-2">
              {locationPrecision && (
                <div className="flex items-center">
                  <span className="text-xs mr-1">Precisão:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    effectivePrecision === 'alta' 
                      ? 'bg-green-100 text-green-800' 
                      : effectivePrecision === 'média'
                      ? 'bg-yellow-100 text-yellow-800'
                      : effectivePrecision === 'baixa'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {effectivePrecision === 'alta' 
                      ? 'Alta' 
                      : effectivePrecision === 'média'
                      ? 'Média'
                      : effectivePrecision === 'baixa'
                      ? 'Baixa'
                      : 'Buscando...'}
                  </span>
              </div>
              )}
              {typeof effectiveAccuracy === 'number' && (
                <div className="text-xs text-gray-500">Leitura atual: ±{Math.round(effectiveAccuracy)}m</div>
              )}
              <button
                type="button"
                onClick={() => {
                  // Preferir leitura do Android quando disponível
                  const android = androidLocation?.location;
                  let candidate = null;
                  if (android && typeof android.accuracy === 'number' && android.accuracy <= 500) {
                    candidate = { lat: android.lat, lng: android.lng, address: '' };
                  } else if (location) {
                    candidate = { lat: location.latitude, lng: location.longitude, address: '' };
                  }
                  if (!candidate) return;
                  // Pede permissão se ainda estiver em prompt
                  if (permissionStatus === 'prompt') {
                    requestPermission();
                  }
                  const prec = effectivePrecision;
                  if (prec === 'baixa' || location?.isDefault) {
                    toast('Sua localização está imprecisa (Baixa). Ajuste no mapa ou escolha nas sugestões.', { icon: '📍' });
                  }
                  setOrigin(candidate);
                  // Fechar modal de erro se estiver aberto
                  try { dismissLocationError?.(); } catch {}
                  // Disparar refinamento e boost para tentar melhorar a precisão
                  if (permissionStatus === 'granted') {
                    try { refineLowPrecision?.(); } catch {}
                    try { startPrecisionBoost?.(45000); } catch {}
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                Usar minha localização
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Fallback por rede/IP para obter uma posição aproximada no navegador
                  try {
                    const coarse = await getCoarseLocation?.();
                    if (coarse && typeof coarse.latitude === 'number' && typeof coarse.longitude === 'number') {
                      setOrigin({ lat: coarse.latitude, lng: coarse.longitude, address: '' });
                      toast('Localização aproximada aplicada.', { icon: '🗺️' });
                    } else {
                      toast('Não foi possível obter localização aproximada.', { icon: '⚠️' });
                    }
                  } catch (e) {
                    console.warn('Falha ao obter localização aproximada:', e);
                    toast('Erro ao obter localização aproximada.', { icon: '⚠️' });
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                Localização aproximada (rede)
              </button>
              <button
                type="button"
                onClick={() => {
                  // Em navegador, acionar refinamento e boost manualmente
                  try {
                    refineLowPrecision?.();
                    startPrecisionBoost?.(60000);
                    toast('Refinando GPS por 60s. Mantenha-se parado para melhorar.', { icon: '🛰️' });
                  } catch (e) {
                    console.warn('Falha ao acionar refinamento/boost:', e);
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                Refinar GPS
              </button>
            </div>
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
          disabled={!origin || !destination || (!origin.address && origin.lat == null) || (!destination.address && destination?.lat == null)}
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
