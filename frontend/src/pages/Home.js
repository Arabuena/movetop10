import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Bem-vindo ao Leva
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Seu app de transporte seguro e confiável
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-4">
              Entre ou cadastre-se para começar
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-4">
              Olá, {user.name}!
            </p>
            <div className="flex justify-center space-x-4">
              {user.role === 'passenger' ? (
                <Link
                  to="/request-ride"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Solicitar Corrida
                </Link>
              ) : user.role === 'driver' ? (
                <Link
                  to="/driver-dashboard"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Dashboard do Motorista
                </Link>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Viagens Seguras</h3>
            <p className="text-gray-600">
              Motoristas verificados e monitoramento em tempo real
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Preços Justos</h3>
            <p className="text-gray-600">
              Tarifas transparentes e sem surpresas
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Atendimento 24h</h3>
            <p className="text-gray-600">
              Suporte disponível a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 