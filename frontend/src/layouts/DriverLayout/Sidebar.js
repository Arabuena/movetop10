import React from 'react';
import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Início', path: '/driver', icon: 'home' },
  { name: 'Corridas', path: '/driver/rides', icon: 'local_taxi' },
  { name: 'Ganhos', path: '/driver/earnings', icon: 'payments' },
  { name: 'Avaliações', path: '/driver/reviews', icon: 'star' },
  { name: 'Ajuda', path: '/driver/support', icon: 'help' },
  { name: 'Configurações', path: '/driver/settings', icon: 'settings' }
];

const Sidebar = () => {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto border-r border-move-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <img
            className="h-8 w-auto"
            src="/logo192.png"
            alt="Move"
          />
        </div>
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-move-primary/10 text-move-primary'
                      : 'text-move-gray-600 hover:bg-move-gray-100'
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