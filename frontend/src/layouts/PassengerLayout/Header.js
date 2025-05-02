import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-move-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img
              className="h-8 w-auto"
              src="/logo192.png"
              alt="Move"
            />
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="text-sm text-white text-right">
                <div className="font-medium">{user?.name}</div>
                <div className="opacity-80">{user?.phone}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-icons-outlined text-white">
                  person
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 