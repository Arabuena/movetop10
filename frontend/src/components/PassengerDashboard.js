import React from 'react';
import { Link } from 'react-router-dom';

const PassengerDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Painel do Passageiro</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card para Solicitar Corrida */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Solicitar Corrida</h3>
          <p className="text-gray-600 mb-4">
            Precisa ir a algum lugar? Solicite uma corrida agora mesmo!
          </p>
          <Link
            to="/request-ride"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Solicitar Corrida
          </Link>
        </div>

        {/* Card para Histórico */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Minhas Corridas</h3>
          <p className="text-gray-600 mb-4">
            Veja seu histórico de corridas e avaliações.
          </p>
          <Link
            to="/ride-history"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Ver Histórico
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard; 