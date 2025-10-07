import React, { useState } from 'react';
import { useDriver } from '../../driver/contexts/DriverContext';
import Map from '../../driver/components/Map';
import StatusToggle from '../../driver/components/StatusToggle';
import RideRequest from '../../driver/components/RideRequest';
import Stats from '../../driver/components/Stats';
import LocationError from '../../components/common/LocationError';
import logger from '../../utils/logger';

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
          <Stats data={stats} />
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