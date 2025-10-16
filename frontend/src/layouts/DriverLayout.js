// src/layouts/DriverLayout.js
// Componente: DriverLayout
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDriver } from '../driver/contexts/DriverContext';
import Logo from '../components/common/Logo';

const DriverLayout = () => {
  const { logout } = useAuth();
  const { currentRide, acceptRide, isUpdating } = useDriver();
  const isPending = currentRide && (currentRide.status === 'pending' || currentRide.status === 'requested');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition duration-150"
              >
                <span className="h-5 w-5 mr-1">→</span>
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal centralizado */}
      <main className="p-4">
        <Outlet />
      </main>

      {/* Botão fixo para aceitar corrida pendente */}
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
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-lg border-2 transition
            ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 border-green-700 text-white hover:bg-green-700'}`}
          aria-label="Aceitar corrida pendente"
          title="Aceitar corrida pendente"
        >
          {isUpdating ? 'Processando...' : 'Aceitar corrida'}
        </button>
      )}
    </div>
  );
};

export default DriverLayout;
