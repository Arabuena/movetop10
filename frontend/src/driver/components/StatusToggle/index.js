import React from 'react';
import logger from '../../../utils/logger';

const StatusToggle = ({ isOnline, onToggle }) => {
  const handleToggle = () => {
    logger.debug('Alterando status do motorista', { wasOnline: isOnline });
    onToggle();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
          transition-colors duration-200 ease-in-out 
          ${isOnline ? 'bg-green-500' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow 
            transition duration-200 ease-in-out
            ${isOnline ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
      <span className="text-sm font-medium text-gray-900">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

export default StatusToggle; 