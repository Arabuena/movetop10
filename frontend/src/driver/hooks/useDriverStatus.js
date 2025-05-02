import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import logger from '../../utils/logger';

const useDriverStatus = () => {
  const { socket, connected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('driver:statusUpdated', (data) => {
      setIsOnline(data.status === 'online');
      setIsUpdating(false);
      logger.debug('Status atualizado:', data);
    });

    socket.on('driver:statusError', (error) => {
      setError(error.message);
      setIsUpdating(false);
      logger.error('Erro ao atualizar status:', error);
    });

    return () => {
      socket.off('driver:statusUpdated');
      socket.off('driver:statusError');
    };
  }, [socket]);

  const toggleStatus = useCallback(async () => {
    if (!socket || !connected || isUpdating) {
      logger.warn('Não é possível alterar status:', { socket: !!socket, connected, isUpdating });
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const newStatus = !isOnline;
      logger.debug('Alterando status para:', newStatus ? 'online' : 'offline');

      return new Promise((resolve, reject) => {
        socket.emit('driver:updateStatus', { 
          status: newStatus ? 'online' : 'offline' 
        }, (response) => {
          if (response.error) {
            setError(response.error);
            reject(new Error(response.error));
          } else {
            setIsOnline(newStatus);
            resolve(response);
          }
          setIsUpdating(false);
        });

        // Timeout de segurança
        setTimeout(() => {
          setIsUpdating(false);
          reject(new Error('Timeout ao atualizar status'));
        }, 5000);
      });
    } catch (err) {
      setError(err.message);
      setIsUpdating(false);
      throw err;
    }
  }, [socket, connected, isOnline, isUpdating]);

  return {
    isOnline,
    isUpdating,
    error,
    toggleStatus
  };
};

export default useDriverStatus; 