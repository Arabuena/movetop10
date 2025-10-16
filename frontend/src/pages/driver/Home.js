import React, { useState } from 'react';
import { useDriver } from '../../driver/contexts/DriverContext';
import Map from '../../driver/components/Map';
import StatusToggle from '../../driver/components/StatusToggle';
import RideRequest from '../../driver/components/RideRequest';
import Stats from '../../driver/components/Stats';
import LocationError from '../../components/common/LocationError';
import logger from '../../utils/logger';
import { calculateRoute } from '../../driver/utils/mapUtils';

const DriverHome = () => {
  const { 
    isOnline,
    isUpdating,
    location,
    currentRide,
    stats,
    error,
    toggleStatus,
    acceptRide,
    rejectRide,
    continueWithDefaultLocation
  } = useDriver();
  
  const [showError, setShowError] = useState(!!error);
  const [eta, setEta] = useState(null);
  const [etaLabel, setEtaLabel] = useState('');
  const [loadingEta, setLoadingEta] = useState(false);

  // Helper para normalizar pontos (origin/destination) da corrida em { lat, lng }
  const toLatLng = (loc) => {
    if (!loc) return null;
    if (loc.coordinates && Array.isArray(loc.coordinates)) {
      // Formato [lng, lat]
      return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
    }
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
    // Se vier como string endereço, poderíamos passar direto para DirectionsService,
    // mas priorizamos coordenadas para evitar geocoding adicional.
    return null;
  };

  React.useEffect(() => {
    try {
      if (!currentRide || !location) {
        setEta(null);
        return;
      }
      // Garantir que Google Maps já está disponível
      if (!window.google || !window.google.maps) {
        // Evita erro enquanto o script carrega; recalcularemos quando disponível
        return;
      }

      let target = null;
      let label = '';

      if (currentRide.status === 'accepted') {
        target = toLatLng(currentRide.origin);
        label = 'ETA até o passageiro';
      } else if (currentRide.status === 'in_progress') {
        target = toLatLng(currentRide.destination);
        label = 'ETA até o destino';
      } else {
        setEta(null);
        return;
      }

      if (!target) {
        setEta(null);
        return;
      }

      setLoadingEta(true);
      setEtaLabel(label);

      (async () => {
        try {
          // Usa localização efetiva para ETA: real se precisão <= 100m, caso contrário origem da corrida
          const originForETA = (() => {
            if (location && typeof location.accuracy === 'number' && location.accuracy <= 100 && !location.isDefault) {
              return location;
            }
            const originLatLng = toLatLng(currentRide.origin);
            return originLatLng || location;
          })();

          const result = await calculateRoute(originForETA, target);
          setEta({ duration: result.duration, distance: result.distance }); // duração em segundos, distância em metros
        } catch (err) {
          console.error('Erro ao calcular ETA:', err);
          setEta(null);
        } finally {
          setLoadingEta(false);
        }
      })();
    } catch (error) {
      console.error('Erro no cálculo de ETA:', error);
      setEta(null);
      setLoadingEta(false);
    }
  }, [currentRide, location]);

  // Função para lidar com o botão "Tentar Novamente"
  const handleRetry = () => {
    window.location.reload();
  };

  // Função para continuar com localização padrão
  const handleContinueWithDefault = () => {
    if (continueWithDefaultLocation) {
      continueWithDefaultLocation();
      setShowError(false);
    }
  };

  // Mostrar erro se houver
  if (error && showError) {
    const isGPSError = error.includes('GPS') || error.includes('indisponível') || error.includes('localização');
    
    if (isGPSError) {
      return (
        <LocationError 
          error={error}
          onRequestPermission={handleRetry}
          onContinueWithDefault={handleContinueWithDefault}
          permissionStatus="prompt"
        />
      );
    }
    
    return (
      <div className="h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 rounded-lg bg-white shadow-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header com status e estatísticas */}
      <header className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <StatusToggle 
            isOnline={isOnline} 
            isUpdating={isUpdating}
            onToggle={toggleStatus} 
          />
          <div className="flex items-center gap-4">
            <Stats data={stats} />
            {(currentRide && (currentRide.status === 'accepted' || currentRide.status === 'in_progress')) && (
              <div className="ml-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm whitespace-nowrap">
                {loadingEta
                  ? 'Calculando ETA...'
                  : eta
                    ? `${etaLabel}: ${Math.round(eta.duration / 60)} min`
                    : 'ETA indisponível'}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mapa principal */}
      <main className="flex-1 relative">
        <Map 
          center={location}
          isOnline={isOnline}
          currentRide={currentRide}
        />
      </main>

      {/* Painel de corrida atual */}
      {currentRide && (
        <RideRequest 
          ride={currentRide}
          onAccept={() => acceptRide(currentRide._id)}
          onReject={() => rejectRide(currentRide._id)}
        />
      )}


    </div>
  );
};

export default DriverHome;