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
    location,
    currentRide,
    stats,
    acceptRide,
    isUpdating
  } = useDriver();

  // Debug do currentRide
  console.log('🏠 [DASHBOARD] currentRide:', currentRide);
  console.log('🏠 [DASHBOARD] currentRide status:', currentRide?.status);
  console.log('🏠 [DASHBOARD] Renderizando RideRequest?', !!currentRide);

  const isPending = currentRide && (currentRide.status === 'pending' || currentRide.status === 'requested');

  return (
    <div className="h-screen flex flex-col">
      {/* Header com status */}
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <StatusToggle 
              isOnline={isOnline} 
              onToggle={toggleStatus} 
            />
            {isPending && (
              <button
                onClick={async () => {
                  if (isUpdating) return;
                  const rideId = currentRide?._id || currentRide?.id;
                  if (!rideId) return;
                  try {
                    await acceptRide(rideId);
                  } catch (e) {
                    console.error('Erro ao aceitar corrida:', e);
                  }
                }}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Aceitar corrida pendente"
                title="Aceitar corrida pendente"
              >
                {isUpdating ? 'Processando...' : 'Aceitar corrida'}
              </button>
            )}
          </div>
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
        <RideRequest ride={currentRide} />
      )}


    </div>
  );
};

export default Dashboard;