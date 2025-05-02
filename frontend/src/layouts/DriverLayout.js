// src/layouts/DriverLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DriverLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar atualizada e simplificada */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center"> {/* Alinhamento vertical centralizado */}
            <div className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt="Logo"
              />
            </div>

            {/* Botão de logout com substituição do ícone */}
            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition duration-150"
              >
                {/* Substituímos o ícone Heroicons por uma seta simples */}
                <span className="h-5 w-5 mr-1">→</span> {/* Seta simples para 'Sair' */}
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
    </div>
  );
};

export default DriverLayout;
