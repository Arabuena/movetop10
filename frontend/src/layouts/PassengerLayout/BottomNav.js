import React from 'react';
import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Início', path: '/passenger', icon: 'home' },
  { name: 'Corridas', path: '/passenger/rides', icon: 'local_taxi' },
  { name: 'Pagamentos', path: '/passenger/payments', icon: 'payments' },
  { name: 'Perfil', path: '/passenger/profile', icon: 'person' }
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-99-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs ${
                  isActive
                    ? 'text-99-primary'
                    : 'text-99-gray-600 hover:text-99-gray-900'
                }`
              }
            >
              <span className="material-icons-outlined text-xl mb-1">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav; 