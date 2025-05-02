import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="text-99-gray-500 hover:text-99-gray-600"
            >
              <span className="material-icons-outlined">menu</span>
            </button>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-99-gray-200 flex items-center justify-center">
                  <span className="material-icons-outlined text-99-gray-600">
                    person
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-99-gray-900">{user?.name}</div>
                  <div className="text-99-gray-500">{user?.rating} ★</div>
                </div>
              </div>

              {/* Botão original com Tailwind comentado */}
              {/*
              <button
                onClick={logout}
                className="text-99-gray-500 hover:text-99-gray-600"
              >
                <span className="material-icons-outlined">logout</span>
              </button>
              */}

              {/* Novo botão roxo personalizado */}
              <button
                onClick={logout}
                style={{
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
