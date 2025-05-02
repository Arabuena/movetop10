import React from 'react';
import { useDriver } from '../../contexts/DriverContext';
import Map from '../../components/Map';
import StatusToggle from '../../components/StatusToggle';
import RideRequest from '../../components/RideRequest';
import Stats from '../../components/Stats';
import logger from '../../../utils/logger';

const Dashboard = () => {
  const { 
    isOnline, 
    toggleOnlineStatus, 
    currentLocation,
    currentRide,
    stats 
  } = useDriver();

  return (
    <div className="h-screen flex flex-col">
      {/* Header com status */}
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <StatusToggle 
            isOnline={isOnline} 
            onToggle={toggleOnlineStatus} 
          />
          <Stats data={stats} />
        </div>
      </header>

      {/* Mapa principal */}
      <main className="flex-1 relative">
        <Map 
          center={currentLocation}
          isOnline={isOnline}
          currentRide={currentRide}
        />
      </main>

      {/* Painel de corrida atual */}
      {currentRide && (
        <RideRequest ride={currentRide} />
      )}

      {/* Botão de debug */}
      {process.env.NODE_ENV !== 'production' && (
        <button 
          onClick={() => logger.showLogsInUI()}
          className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded"
        >
          Debug Logs
        </button>
      )}
    </div>
  );
};

export default Dashboard; 