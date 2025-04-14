import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  MapIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import Logo from '../components/common/Logo';

const PassengerLayout = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Logo className="h-8 w-auto" />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/passenger"
                  className="border-transparent text-move-gray-500 hover:border-move-gray-300 hover:text-move-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <HomeIcon className="h-5 w-5 mr-1" />
                  Início
                </Link>
                <Link
                  to="/passenger/rides"
                  className="border-transparent text-move-gray-500 hover:border-move-gray-300 hover:text-move-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <MapIcon className="h-5 w-5 mr-1" />
                  Minhas Corridas
                </Link>
                <Link
                  to="/passenger/profile"
                  className="border-transparent text-move-gray-500 hover:border-move-gray-300 hover:text-move-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <UserCircleIcon className="h-5 w-5 mr-1" />
                  Perfil
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-move-gray-700 bg-move-gray-50 hover:bg-move-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-move-primary"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default PassengerLayout; 