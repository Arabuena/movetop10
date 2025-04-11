import React from 'react';

const statusActions = {
  ACCEPTED: {
    text: 'Cheguei ao local',
    nextStatus: 'ARRIVED',
    color: 'bg-yellow-400'
  },
  ARRIVED: {
    text: 'Iniciar corrida',
    nextStatus: 'IN_PROGRESS',
    color: 'bg-yellow-400'
  },
  IN_PROGRESS: {
    text: 'Finalizar corrida',
    nextStatus: 'COMPLETED',
    color: 'bg-green-500'
  }
};

const RideActions = ({ ride, onStatusUpdate, onChat, onCall }) => {
  const currentAction = statusActions[ride.status];

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-around">
        <button
          onClick={onChat}
          className="flex flex-col items-center text-gray-600"
        >
          <span className="material-icons-outlined mb-1">chat</span>
          <span className="text-sm">Mensagem</span>
        </button>

        <button
          onClick={onCall}
          className="flex flex-col items-center text-gray-600"
        >
          <span className="material-icons-outlined mb-1">phone</span>
          <span className="text-sm">Ligar</span>
        </button>

        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.destination.coordinates.lat},${ride.destination.coordinates.lng}`)}
          className="flex flex-col items-center text-gray-600"
        >
          <span className="material-icons-outlined mb-1">navigation</span>
          <span className="text-sm">Navegar</span>
        </button>
      </div>

      {currentAction && (
        <button
          onClick={() => onStatusUpdate(currentAction.nextStatus)}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${currentAction.color} hover:opacity-90`}
        >
          {currentAction.text}
        </button>
      )}
    </div>
  );
};

export default RideActions; 