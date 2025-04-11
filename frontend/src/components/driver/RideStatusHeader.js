import React from 'react';

const statusMessages = {
  ACCEPTED: 'A caminho do passageiro',
  ARRIVED: 'Aguardando passageiro',
  IN_PROGRESS: 'Em viagem',
  COMPLETED: 'Corrida finalizada',
  CANCELLED: 'Corrida cancelada'
};

const RideStatusHeader = ({ status }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{statusMessages[status]}</h2>
        <div className={`h-2 w-2 rounded-full ${
          status === 'COMPLETED' ? 'bg-green-500' : 
          status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
      </div>
    </div>
  );
};

export default RideStatusHeader; 