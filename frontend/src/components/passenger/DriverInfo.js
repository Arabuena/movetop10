import React from 'react';

const DriverInfo = ({ driver, vehicle }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center">
        <img 
          src={driver.photo || '/images/default-avatar.png'} 
          alt={driver.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="ml-4">
          <h3 className="font-medium">{driver.name}</h3>
          <p className="text-sm text-gray-500">
            {vehicle.model} • {vehicle.plate}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-sm">{driver.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInfo; 