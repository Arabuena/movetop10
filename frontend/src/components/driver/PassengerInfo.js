import React from 'react';

const PassengerInfo = ({ passenger, origin, destination, distance, duration }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={passenger?.photo || '/images/default-avatar.png'}
          alt={passenger?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-medium">{passenger?.name}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-yellow-400">★</span>
            <span className="ml-1">{passenger?.rating?.toFixed(1) || '5.0'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start">
          <span className="material-icons-outlined text-gray-400 mr-2">
            location_on
          </span>
          <div>
            <p className="text-gray-500">Origem</p>
            <p>{origin.address}</p>
          </div>
        </div>
        <div className="flex items-start">
          <span className="material-icons-outlined text-gray-400 mr-2">
            flag
          </span>
          <div>
            <p className="text-gray-500">Destino</p>
            <p>{destination.address}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <div>
          <p className="font-medium">Distância</p>
          <p>{distance || '0 km'}</p>
        </div>
        <div>
          <p className="font-medium">Tempo estimado</p>
          <p>{duration || '0 min'}</p>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfo; 