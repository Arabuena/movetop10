import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDriver } from '../../driver/contexts/DriverContext';

const DriverLayout = () => {
  const { currentRide, acceptRide, isUpdating } = useDriver();
  const isPending = currentRide && (currentRide.status === 'pending' || currentRide.status === 'requested');
  return (
    <div className="min-h-screen bg-99-gray-100">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        {/* Botão fixo: aceitar corrida quando houver uma pendente */}
        {isPending && (
          <button
            onClick={async () => {
              if (isUpdating) return;
              const rideId = currentRide._id || currentRide.id;
              if (!rideId) return;
              try {
                await acceptRide(rideId);
              } catch (e) {
                console.error('Erro ao aceitar corrida:', e);
              }
            }}
            disabled={isUpdating}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-lg border-2 transition
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 border-green-700 text-white hover:bg-green-700'}`}
            aria-label="Aceitar corrida pendente"
            title="Aceitar corrida pendente"
          >
            {isUpdating ? 'Processando...' : 'Aceitar corrida'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverLayout;