import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.debug('Driver Dashboard mounting...', {
      userId: user?._id,
      userType: user?.userType,
      timestamp: new Date().toISOString()
    });

    try {
      // Log the initial state
      logger.debug('Initial state:', {
        isLoading,
        currentLocation,
        isOnline,
        userId: user?._id
      });

      // Verificar se o usuário está autenticado
      if (!user) {
        logger.warn('Usuário não autenticado');
        setError('Não autorizado');
        return;
      }

      // Verificar se é um motorista
      if (user.userType !== 'driver') {
        logger.warn('Usuário não é motorista', { userType: user.userType });
        setError('Acesso não permitido');
        return;
      }

      // Initialize your dashboard here
      setIsLoading(false);
      
    } catch (error) {
      logger.error('Error in Driver Dashboard:', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });
      setError(error.message);
      setIsLoading(false);
    }
  }, [user]);

  const showDebugLogs = () => {
    logger.showLogsInUI();
  };

  if (error) {
    return <div className="text-red-600">Erro: {error}</div>;
  }

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Não autorizado</div>;
  }

  return (
    <div className="driver-dashboard">
      <h1>Dashboard do Motorista</h1>
      {process.env.NODE_ENV !== 'production' && (
        <button 
          onClick={showDebugLogs}
          className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded"
        >
          Show Logs
        </button>
      )}
      {/* Add your dashboard content here */}
    </div>
  );
};

export default DriverDashboard; 