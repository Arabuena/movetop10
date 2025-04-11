import React from 'react';

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800'
};

const RideHistoryCard = ({ ride, onClick }) => {
  const formattedDate = new Date(ride.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {formattedDate}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[ride.status] || 'bg-gray-100 text-gray-800'
            }`}>
              {ride.status}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              <span className="font-medium">De:</span> {ride.origin.address}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Para:</span> {ride.destination.address}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-gray-900">
            R$ {ride.price.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            {ride.distance} • {ride.duration}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className="flex items-center">
          <img
            src={ride.passenger?.photo || '/images/default-avatar.png'}
            alt={ride.passenger?.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="ml-2 text-sm text-gray-600">
            {ride.passenger?.name}
          </span>
        </div>
        {ride.passenger?.rating && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-yellow-400">★</span>
            <span className="ml-1">{ride.passenger.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistoryCard; 