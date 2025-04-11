import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Início', path: '/driver/home', icon: 'home' },
    { name: 'Corridas', path: '/driver/history', icon: 'history' },
    { name: 'Ganhos', path: '/driver/earnings', icon: 'payments' },
    { name: 'Avaliações', path: '/driver/reviews', icon: 'star' },
    { name: 'Configurações', path: '/driver/settings', icon: 'settings' },
    { name: 'Ajuda', path: '/driver/support', icon: 'help' }
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <img
            className="h-8 w-auto"
            src="/logo.svg"
            alt="99"
          />
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="material-icons-outlined mr-3 h-6 w-6">
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 