import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const SocketContext = createContext({});

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    if (!socketRef.current) {
      // Usando a URL correta do backend definida no .env.development
      socketRef.current = io(process.env.REACT_APP_API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: user.token
        }
      });

      socketRef.current.on('connect', () => {
        logger.debug('Socket conectado');
        setConnected(true);

        socketRef.current.emit('authenticate', {
          userId: user._id,
          userType: user.userType
        });
      });

      socketRef.current.on('disconnect', () => {
        logger.warn('Socket desconectado');
        setConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const requestRide = async (rideData) => {
    if (!socketRef.current || !connected) {
      throw new Error('Socket não está conectado');
    }

    // Validar dados antes de enviar
    if (!rideData.origin || !rideData.destination || !rideData.price || !rideData.distance || !rideData.duration) {
      throw new Error('Dados de corrida incompletos');
    }

    return new Promise((resolve, reject) => {
      logger.debug('Solicitando corrida:', rideData);

      const timeout = setTimeout(() => {
        reject(new Error('Tempo esgotado ao solicitar corrida'));
      }, 15000); // Aumentado para 15 segundos

      socketRef.current.emit('passenger:requestRide', rideData, (response) => {
        clearTimeout(timeout);
        
        if (!response) {
          logger.error('Resposta vazia do servidor');
          reject(new Error('Resposta vazia do servidor'));
          return;
        }
        
        if (response.error) {
          logger.error('Erro na solicitação:', response.error);
          reject(new Error(response.error));
        } else {
          logger.debug('Corrida solicitada com sucesso:', response);
          resolve(response);
        }
      });
    });
  };

  const value = {
    socket: socketRef.current,
    connected,
    requestRide
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;