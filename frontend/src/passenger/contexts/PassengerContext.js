import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import logger from '../../utils/logger';

export const PassengerProvider = ({ children }) => {
  const { socket, connected, user } = useSocket();
  const { setCurrentRide } = useContext(PassengerContext);

  // Buscar corrida ativa ao conectar
  useEffect(() => {
    if (!socket || !connected || !user) return;

    const fetchActiveRide = () => {
      logger.debug('Buscando corrida ativa do passageiro...');
      socket.emit('passenger:getActiveRide', null, (response) => {
        if (response.error) {
          logger.error('Erro ao buscar corrida ativa:', response.error);
          return;
        }

        if (response.ride) {
          logger.debug('Corrida ativa encontrada:', response.ride);
          setCurrentRide(response.ride);
        }
      });
    };

    fetchActiveRide();
  }, [socket, connected, user]);

  return (
    <PassengerContext.Provider value={{ setCurrentRide }}>
      {children}
    </PassengerContext.Provider>
  );
}; 