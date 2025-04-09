import React from 'react';

const RideHistory = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Histórico de Corridas</h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700">
            <div>Data</div>
            <div>Origem</div>
            <div>Destino</div>
            <div>Status</div>
          </div>
        </div>

        {/* Lista de corridas (exemplo) */}
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>20/03/2024</div>
              <div>Rua A, 123</div>
              <div>Rua B, 456</div>
              <div>
                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  Concluída
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>19/03/2024</div>
              <div>Rua C, 789</div>
              <div>Rua D, 012</div>
              <div>
                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  Concluída
                </span>
              </div>
            </div>
          </div>

          {/* Mensagem quando não há corridas */}
          {/* <div className="px-6 py-8 text-center text-gray-500">
            Nenhuma corrida encontrada no histórico.
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default RideHistory; 