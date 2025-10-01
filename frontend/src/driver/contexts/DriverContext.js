import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import useLocation from '../hooks/useLocation';
import logger from '../../utils/logger';

const DriverContext = createContext({});

export const DriverProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { location, error: locationError, continueWithDefaultLocation } = useLocation();
  
  // Estados
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [earnings, setEarnings] = useState(0);
  const [stats, setStats] = useState({
    totalRides: 0,
    rating: 0,
    todayEarnings: 0
  });

  // Toggle status do motorista
  const toggleStatus = useCallback(async () => {
    if (!socket || !connected || isUpdating) {
      logger.warn('Não é possível alterar status:', { socket: !!socket, connected, isUpdating });
      return;
    }

    try {
      setIsUpdating(true);
      setStatusError(null);

      // Atualizar o estado imediatamente para feedback instantâneo ao usuário
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      logger.debug('Alterando status para:', newStatus ? 'online' : 'offline');

      // Emitir evento sem depender do callback para atualizar o estado
      socket.emit('driver:updateStatus', { 
        status: newStatus ? 'online' : 'offline' 
      }, (response) => {
        // Processar resposta apenas para logging e tratamento de erros
        if (response.error) {
          logger.warn('Erro na resposta do servidor:', response.error);
          setStatusError(response.error);
          // Não revertemos o estado para manter a abordagem otimista
        } else {
          logger.debug('Status confirmado pelo servidor:', response);
        }
        setIsUpdating(false);
      });
      
      // Finalizar o estado de atualização após um tempo, mesmo sem resposta
      setTimeout(() => {
        if (isUpdating) {
          logger.warn('Finalizando estado de atualização após timeout');
          setIsUpdating(false);
        }
      }, 2000);
      
      return Promise.resolve({ success: true, status: newStatus ? 'online' : 'offline' });
    } catch (err) {
      setStatusError(err.message);
      setIsUpdating(false);
      throw err;
    }
  }, [socket, connected, isOnline, isUpdating]);

  // Verificar conexão do socket
  useEffect(() => {
    if (!connected) {
      logger.warn('Socket desconectado');
    } else {
      logger.debug('Socket conectado');
    }
  }, [connected]);

  // Buscar corrida ativa ao conectar
  useEffect(() => {
    if (!socket || !connected || !user) return;

    const fetchActiveRide = () => {
      logger.debug('Buscando corrida ativa...');
      socket.emit('driver:getActiveRide', null, (response) => {
        if (response.error) {
          logger.error('Erro ao buscar corrida ativa:', response.error);
          return;
        }

        if (response.ride) {
          logger.debug('Corrida ativa encontrada:', response.ride);
          setCurrentRide(response.ride);
          setIsOnline(true); // Se tiver corrida ativa, fica online
        }
      });
    };

    fetchActiveRide();
  }, [socket, connected, user]);

  // Ouvir eventos de corrida
  useEffect(() => {
    if (!socket) return;

    // Remover listeners anteriores para evitar duplicação
    socket.off('driver:rideRequest');
    socket.off('driver:newRideAvailable');
    socket.off('driver:rideAccepted');
    socket.off('driver:rideUpdated');
    socket.off('driver:rideCancelled');
    socket.off('driver:rideCompleted');
    socket.off('driver:statsUpdated');

    socket.on('driver:rideRequest', (ride) => {
      logger.debug('Nova solicitação de corrida:', ride);
      setCurrentRide(ride);
    });

    socket.on('driver:newRideAvailable', (data) => {
      logger.debug('Nova corrida disponível:', data);
      if (data && data.ride) {
        setCurrentRide(data.ride);
      }
    });

    socket.on('driver:rideAccepted', (ride) => {
      logger.debug('Corrida aceita:', ride);
      setCurrentRide(ride);
    });

    socket.on('driver:rideUpdated', (ride) => {
      logger.debug('Corrida atualizada:', ride);
      setCurrentRide(ride);
    });

    socket.on('driver:rideCancelled', () => {
      logger.debug('Corrida cancelada');
      setCurrentRide(null);
    });

    socket.on('driver:rideCompleted', () => {
      logger.debug('Corrida finalizada');
      setCurrentRide(null);
    });

    socket.on('driver:statsUpdated', (newStats) => {
      logger.debug('Estatísticas atualizadas:', newStats);
      setStats(newStats);
    });

    // Evento para testar a conexão
    socket.emit('test:ping', { message: 'Teste de conexão do motorista' }, (response) => {
      logger.debug('Resposta do ping:', response);
    });

    return () => {
      socket.off('driver:rideRequest');
      socket.off('driver:newRideAvailable');
      socket.off('driver:rideAccepted');
      socket.off('driver:rideUpdated');
      socket.off('driver:rideCancelled');
      socket.off('driver:rideCompleted');
      socket.off('driver:statsUpdated');
    };
  }, [socket, logger]);

  // Enviar localização quando online
  useEffect(() => {
    if (!socket || !location || !isOnline) return;

    socket.emit('driver:updateLocation', location);
    logger.debug('Localização enviada:', location);
  }, [socket, location, isOnline]);

  // Funções para gerenciar corridas
  const acceptRide = useCallback(async (rideId) => {
    if (!socket || !connected) {
      throw new Error('Socket não está conectado');
    }

    try {
      logger.debug('Tentando aceitar corrida:', rideId);
      
      return new Promise((resolve, reject) => {
        socket.emit('driver:acceptRide', { rideId }, (response) => {
          if (response.success) {
            logger.debug('Corrida aceita com sucesso:', response.ride);
            setCurrentRide(response.ride);
            resolve(response.ride);
          } else {
            logger.error('Erro ao aceitar corrida:', response.error);
            reject(new Error(response.error));
          }
        });

        // Timeout reduzido para 10 segundos
        setTimeout(() => {
          reject(new Error('Tempo esgotado ao aceitar corrida'));
        }, 10000);
      });
    } catch (error) {
      logger.error('Erro ao aceitar corrida:', error);
      throw error;
    }
  }, [socket, connected]);

  const rejectRide = useCallback((rideId) => {
    if (!socket) {
      logger.error('Socket não disponível para rejeitar corrida');
      return;
    }

    try {
      socket.emit('driver:rejectRide', { rideId });
      logger.debug('Corrida rejeitada:', rideId);
      setCurrentRide(null);
    } catch (error) {
      logger.error('Erro ao rejeitar corrida:', error);
      throw error;
    }
  }, [socket]);

  const completeRide = async (rideId) => {
    try {
      socket.emit('driver:completeRide', { rideId });
      logger.debug('Finalizando corrida:', rideId);
      setCurrentRide(null);
    } catch (error) {
      logger.error('Erro ao finalizar corrida:', error);
      throw error;
    }
  };

  const value = {
    user,
    isOnline,
    isUpdating,
    location,
    currentRide,
    earnings,
    stats,
    error: locationError || statusError,
    toggleStatus,
    acceptRide,
    rejectRide,
    completeRide,
    continueWithDefaultLocation
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver deve ser usado dentro de um DriverProvider');
  }
  return context;
};

export default DriverContext;