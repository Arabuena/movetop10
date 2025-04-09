import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Painel Administrativo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Usuários */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Usuários</h3>
          <p className="text-gray-600 mb-4">
            Gerenciar motoristas e passageiros
          </p>
          <button className="text-blue-600 hover:text-blue-800">
            Ver Usuários
          </button>
        </div>

        {/* Card de Corridas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Corridas</h3>
          <p className="text-gray-600 mb-4">
            Monitorar corridas ativas e histórico
          </p>
          <button className="text-blue-600 hover:text-blue-800">
            Ver Corridas
          </button>
        </div>

        {/* Card de Relatórios */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Relatórios</h3>
          <p className="text-gray-600 mb-4">
            Análise de dados e métricas
          </p>
          <button className="text-blue-600 hover:text-blue-800">
            Ver Relatórios
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 