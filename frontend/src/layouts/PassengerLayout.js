import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  MapIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import Logo from '../components/common/Logo';

const PassengerLayout = () => {
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  const menuItems = [
    { 
      path: '/passenger',
      icon: HomeIcon, 
      text: 'Início'
    },
    { 
      path: '/passenger/rides',
      icon: MapIcon, 
      text: 'Minhas Corridas'
    },
    { 
      path: '/passenger/profile',
      icon: UserCircleIcon, 
      text: 'Perfil'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar simplificada */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Botão do menu */}
              <button
                onClick={() => setShowMenu(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <div className="ml-4">
                <Logo className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu lateral */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          showMenu ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <Logo className="h-8 w-auto" />
            <button 
              onClick={() => setShowMenu(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Informações do usuário */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Bem-vindo(a)</div>
            <div className="text-lg font-semibold">{user?.name}</div>
          </div>

          {/* Links do menu */}
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMenu(false)}
                className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-move-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.text}
              </Link>
            ))}

            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para fechar o menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Conteúdo principal */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default PassengerLayout; 