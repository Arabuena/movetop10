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
                  src="/images/logo-99.svg"
                  alt="99"
                />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/login/passenger"
              className="text-99-gray-600 hover:text-99-gray-900 text-sm font-medium"
            >
              Sou passageiro
            </Link>
            <Link
              to="/login/driver"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-99-primary hover:bg-99-primary/90"
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