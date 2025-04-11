import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="99"
                />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login/passenger"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Sou passageiro
            </Link>
            <Link
              to="/login/driver"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Sou motorista
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 