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
    toggleStatus, 
    currentLocation,
    currentRide,
    stats 
  } = useDriver();

  // Debug do currentRide
  console.log('🏠 [DASHBOARD] currentRide:', currentRide);
  console.log('🏠 [DASHBOARD] currentRide status:', currentRide?.status);
  console.log('🏠 [DASHBOARD] Renderizando RideRequest?', !!currentRide);

  return (
    <div className="h-screen flex flex-col">
      {/* Header com status */}
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <StatusToggle 
            isOnline={isOnline} 
            onToggle={toggleStatus} 
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


    </div>
  );
};

export default Dashboard;