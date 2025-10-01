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

  const toggleStatus = useCallback(() => {
    if (!socket || !connected || isUpdating) {
      logger.warn('Não é possível alterar status:', { socket: !!socket, connected, isUpdating });
      return Promise.resolve({ success: false, error: 'Socket não conectado' });
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Atualizar o estado imediatamente para feedback instantâneo ao usuário
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      
      logger.debug('Alterando status para:', newStatus ? 'online' : 'offline');

      // Emitir evento sem esperar callback
      socket.emit('driver:updateStatus', { 
        status: newStatus ? 'online' : 'offline' 
      }, (response) => {
        // Processar resposta apenas para logging
        if (response && response.success) {
          logger.debug('Status confirmado pelo servidor:', response);
        } else {
          const errorMsg = response?.error || 'Erro ao atualizar status';
          logger.warn('Erro na resposta do servidor, mas mantendo estado local:', errorMsg);
          setError(errorMsg);
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
      setError(err.message);
      setIsUpdating(false);
      logger.error('Erro ao processar alteração de status:', err);
      return Promise.resolve({ success: false, error: err.message });
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