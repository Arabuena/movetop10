import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const AuthHeader = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <Logo className="h-8 w-auto" />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/login/passenger"
              className="text-move-gray-600 hover:text-move-gray-700 text-sm font-medium"
            >
              Sou passageiro
            </Link>
            <Link
              to="/login/driver"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-move-primary hover:bg-move-primary/90"
            >
              Sou motorista
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader; 