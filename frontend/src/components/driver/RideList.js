import React from 'react';

const RideList = ({ rides }) => {
  if (rides.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <span className="material-icons-outlined text-4xl text-gray-400">
          local_taxi
        </span>
        <p className="mt-2 text-gray-500">
          Nenhuma corrida encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {rides.map(ride => (
          <li key={ride._id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={ride.passenger?.photo || '/images/default-avatar.png'}
                  alt={ride.passenger?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {ride.passenger?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(ride.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  R$ {ride.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {ride.distance} • {ride.duration}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RideList; 