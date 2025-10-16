import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import useLocation from '../hooks/useLocation';
import logger from '../../utils/logger';
import api from '../../services/api';

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

  // Helper para calcular estatísticas do cabeçalho a partir do histórico
  const computeStatsFromRides = useCallback((rides = []) => {
    try {
      const today = new Date();
      const isSameDay = (d1, d2) => (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
      );

      const completedRides = rides.filter(r => r.status === 'completed');
      const ridesToday = completedRides.filter(r => {
        const when = r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt);
        return isSameDay(today, when);
      });

      const todayEarnings = ridesToday.reduce((sum, r) => sum + (r.price || 0), 0);
      const totalRides = ridesToday.length;

      const ratings = completedRides
        .map(r => {
          const drv = r.rating && (r.rating.driver || r.rating?.driverScore);
          return typeof drv === 'number' ? drv : null;
        })
        .filter(v => v !== null);
      const rating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      setStats({ todayEarnings, totalRides, rating });
    } catch (err) {
      logger.error('Erro ao calcular estatísticas do motorista:', err);
    }
  }, [logger]);

  // Buscar histórico de corridas via REST e atualizar estatísticas
  const fetchDriverRidesForStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/driver/rides');
      if (Array.isArray(data)) {
        computeStatsFromRides(data);
      }
    } catch (err) {
      logger.warn('Falha ao buscar corridas do motorista para estatísticas:', err?.message || err);
    }
  }, [user, computeStatsFromRides, logger]);

  // Normaliza payloads de eventos de corrida para garantir que tenha status e IDs
  const normalizeRideData = (data) => {
    if (!data) return null;

    // Caso venha embrulhado em { ride }
    if (data.ride) {
      return { ...data.ride, status: data.ride.status || 'pending' };
    }

    const {
      rideId,
      _id,
      passenger,
      origin,
      destination,
      price,
      distance,
      duration
    } = data;

    return {
      _id: _id || rideId,
      rideId: rideId || _id,
      passenger,
      origin,
      destination,
      price,
      distance,
      duration,
      status: data.status || 'pending'
    };
  };
  // Toggle status do motorista
  const toggleStatus = useCallback(async () => {
    console.log('DriverContext: toggleStatus chamado', { 
      socket: !!socket, 
      connected, 
      isUpdating,
      isOnline 
    });
    
    if (!socket || !connected || isUpdating) {
      console.warn('DriverContext: Não é possível alterar status:', { socket: !!socket, connected, isUpdating });
      logger.warn('Não é possível alterar status:', { socket: !!socket, connected, isUpdating });
      return;
    }

    try {
      setIsUpdating(true);
      setStatusError(null);

      // Atualizar o estado imediatamente para feedback instantâneo ao usuário
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      console.log('DriverContext: Alterando status para:', newStatus ? 'online' : 'offline');
      logger.debug('Alterando status para:', newStatus ? 'online' : 'offline');

      // Emitir evento sem depender do callback para atualizar o estado
      socket.emit('driver:updateStatus', { 
        status: newStatus ? 'online' : 'offline' 
      }, (response) => {
        console.log('DriverContext: Resposta do servidor:', response);
        // Processar resposta apenas para logging e tratamento de erros
        if (response.error) {
          console.warn('DriverContext: Erro na resposta do servidor:', response.error);
          logger.warn('Erro na resposta do servidor:', response.error);
          setStatusError(response.error);
          // Não revertemos o estado para manter a abordagem otimista
        } else {
          console.log('DriverContext: Status confirmado pelo servidor:', response);
          logger.debug('Status confirmado pelo servidor:', response);
        }
        setIsUpdating(false);
      });
      
      // Finalizar o estado de atualização após um tempo, mesmo sem resposta
      setTimeout(() => {
        if (isUpdating) {
          console.warn('DriverContext: Finalizando estado de atualização após timeout');
          logger.warn('Finalizando estado de atualização após timeout');
          setIsUpdating(false);
        }
      }, 2000);
      
      return Promise.resolve({ success: true, status: newStatus ? 'online' : 'offline' });
    } catch (err) {
      console.error('DriverContext: Erro ao alterar status:', err);
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

    console.log('🔌 [DRIVER CONTEXT] Configurando listeners de socket...');
    console.log('🔌 [DRIVER CONTEXT] Socket conectado:', !!socket);
    console.log('🔌 [DRIVER CONTEXT] Status online:', isOnline);

    // Remover listeners anteriores para evitar duplicação
    socket.off('driver:rideRequest');
    socket.off('driver:newRideAvailable');
    socket.off('driver:rideAccepted');
    socket.off('driver:rideUpdated');
    socket.off('driver:rideCancelled');
    socket.off('driver:rideCompleted');
    socket.off('driver:statsUpdated');

    socket.on('driver:rideRequest', (ride) => {
      console.log('🚗 [DRIVER CONTEXT] Nova solicitação de corrida recebida:', ride);
      console.log('🚗 [DRIVER CONTEXT] Status da corrida:', ride?.status);
      console.log('🚗 [DRIVER CONTEXT] Motorista está online?', isOnline);
      logger.debug('Nova solicitação de corrida:', ride);
      const normalized = normalizeRideData(ride);
      setCurrentRide(normalized);
      console.log('🚗 [DRIVER CONTEXT] currentRide atualizado (normalizado) para:', normalized);
    });

    socket.on('driver:newRideAvailable', (data) => {
      console.log('🆕 [DRIVER CONTEXT] Nova corrida disponível:', data);
      console.log('🆕 [DRIVER CONTEXT] Status da corrida:', data?.status);
      console.log('🆕 [DRIVER CONTEXT] Motorista está online?', isOnline);
      logger.debug('Nova corrida disponível:', data);
      const normalized = normalizeRideData(data);
      setCurrentRide(normalized);
      console.log('🆕 [DRIVER CONTEXT] currentRide atualizado para (normalizado):', normalized);
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
      // Atualiza estatísticas após finalizar corrida
      fetchDriverRidesForStats();
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

  // Atualiza estatísticas ao conectar ou quando usuário estiver disponível
  useEffect(() => {
    fetchDriverRidesForStats();
  }, [fetchDriverRidesForStats]);

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

  const completeRide = useCallback(async (rideId) => {
    if (!socket || !connected) {
      throw new Error('Socket não está conectado');
    }

    logger.debug('Tentando finalizar corrida:', rideId);

    return new Promise((resolve, reject) => {
      socket.emit('driver:completeRide', { rideId }, (response) => {
        if (response && response.success) {
          logger.debug('Corrida finalizada com sucesso:', response.ride);
          setCurrentRide(null);
          resolve(response.ride);
        } else {
          const err = response?.error || 'Erro ao finalizar corrida';
          logger.error('Erro ao finalizar corrida:', err);
          reject(new Error(err));
        }
      });

      setTimeout(() => {
        reject(new Error('Tempo esgotado ao finalizar corrida'));
      }, 10000);
    });
  }, [socket, connected]);

  const startRide = useCallback(async (rideId) => {
    if (!socket || !connected) {
      throw new Error('Socket não está conectado');
    }

    try {
      logger.debug('Tentando iniciar corrida:', rideId);

      return new Promise((resolve, reject) => {
        socket.emit('driver:startRide', { rideId }, (response) => {
          if (response && response.success) {
            logger.debug('Corrida iniciada com sucesso:', response.ride);
            setCurrentRide(response.ride);
            resolve(response.ride);
          } else {
            const err = response?.error || 'Erro ao iniciar corrida';
            logger.error('Erro ao iniciar corrida:', err);
            reject(new Error(err));
          }
        });

        setTimeout(() => {
          reject(new Error('Tempo esgotado ao iniciar corrida'));
        }, 10000);
      });
    } catch (error) {
      logger.error('Erro ao iniciar corrida:', error);
      throw error;
    }
  }, [socket, connected]);

  const cancelRide = useCallback(async (rideId) => {
    if (!socket || !connected) {
      throw new Error('Socket não está conectado');
    }

    try {
      logger.debug('Tentando cancelar corrida:', rideId);
      
      return new Promise((resolve, reject) => {
        socket.emit('driver:cancelRide', { rideId }, (response) => {
          if (response && response.success) {
            logger.debug('Corrida cancelada com sucesso');
            setCurrentRide(null);
            resolve();
          } else {
            logger.error('Erro ao cancelar corrida:', response?.error);
            reject(new Error(response?.error || 'Erro ao cancelar corrida'));
          }
        });

        // Timeout de 10 segundos
        setTimeout(() => {
          reject(new Error('Tempo esgotado ao cancelar corrida'));
        }, 10000);
      });
    } catch (error) {
      logger.error('Erro ao cancelar corrida:', error);
      throw error;
    }
  }, [socket, connected]);

  // Método de teste: marcar chegada e iniciar imediatamente
  const arriveAndStart = useCallback(async (rideId) => {
    if (!socket || !connected) {
      throw new Error('Socket não está conectado');
    }

    try {
      logger.debug('Teste: Chegar e iniciar corrida:', rideId);

      return new Promise((resolve, reject) => {
        let handled = false;

        // Fallback: se o ACK do teste não chegar rápido, executar arrived + start
        const fallbackTimer = setTimeout(async () => {
          if (handled) return;
          logger.warn('ACK do teste não recebido. Executando fallback: arrived + start');
          try {
            // Marcar chegada
            await new Promise((res, rej) => {
              socket.emit('driver:arrived', { rideId }, (resp) => {
                if (resp && resp.success) {
                  logger.debug('Fallback: chegada marcada com sucesso');
                  setCurrentRide(resp.ride);
                  res();
                } else {
                  const err = resp?.error || 'Erro ao marcar chegada';
                  logger.error('Fallback: erro ao marcar chegada:', err);
                  rej(new Error(err));
                }
              });
              // Timeout específico para a etapa de chegada
              setTimeout(() => {
                rej(new Error('Tempo esgotado ao marcar chegada'));
              }, 5000);
            });

            // Iniciar a corrida em seguida
            const startedRide = await startRide(rideId);
            handled = true;
            resolve(startedRide);
          } catch (e) {
            handled = true;
            reject(e);
          }
        }, 3000);

        // Tentativa principal: evento de teste que faz ambos (arrive + start)
        socket.emit('driver:testArriveAndStart', { rideId }, (response) => {
          if (handled) return;
          clearTimeout(fallbackTimer);

          if (response && response.success) {
            logger.debug('Teste: corrida atualizada com sucesso:', response.ride);
            setCurrentRide(response.ride);
            handled = true;
            resolve(response.ride);
          } else {
            const err = response?.error || 'Erro no teste Chegar e Iniciar';
            logger.error('Erro no teste Chegar e Iniciar:', err);
            handled = true;
            reject(new Error(err));
          }
        });

        // Guarda de segurança final para evitar travas silenciosas
        setTimeout(() => {
          if (handled) return;
          handled = true;
          reject(new Error('Tempo esgotado no teste Chegar e Iniciar'));
        }, 10000);
      });
    } catch (error) {
      logger.error('Erro no teste Chegar e Iniciar:', error);
      throw error;
    }
  }, [socket, connected, startRide]);

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
    cancelRide
    , startRide
    , arriveAndStart
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