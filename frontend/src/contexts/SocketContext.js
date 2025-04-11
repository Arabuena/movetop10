import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Inicializa o socket com o token de autenticação
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Eventos de conexão
    socketInstance.on('connect', () => {
      console.log('Socket conectado');
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    socketInstance.on('error', (error) => {
      console.error('Erro no socket:', error);
    });

    setSocket(socketInstance);

    // Cleanup na desconexão
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const value = {
    socket,
    connected: socket?.connected || false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 