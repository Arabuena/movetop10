import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Página não encontrada
        </h2>
        <p className="mt-2 text-gray-600">
          A página que você está procurando não existe.
        </p>
        <div className="mt-4">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-500"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 