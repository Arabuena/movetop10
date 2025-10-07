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
    console.log('SocketContext: useEffect executado', { user: !!user, hasSocket: !!socketRef.current });
    
    if (!user) {
      console.log('SocketContext: Usuário não encontrado, desconectando socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    if (!socketRef.current) {
      console.log('SocketContext: Criando nova conexão socket', {
        url: process.env.REACT_APP_API_URL,
        userId: user._id,
        userType: user.userType,
        hasToken: !!localStorage.getItem('token')
      });
      
      // Usando a URL correta do backend definida no .env.development
      socketRef.current = io(process.env.REACT_APP_API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current.on('connect', () => {
        console.log('SocketContext: Socket conectado com sucesso');
        logger.debug('Socket conectado');
        setConnected(true);

        console.log('SocketContext: Enviando autenticação', {
          userId: user._id,
          userType: user.userType
        });

        socketRef.current.emit('authenticate', {
          userId: user._id,
          userType: user.userType
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('SocketContext: Socket desconectado');
        logger.warn('Socket desconectado');
        setConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('SocketContext: Erro de conexão', error);
        logger.error('Erro de conexão do socket:', error);
      });

      socketRef.current.on('authenticated', (data) => {
        console.log('SocketContext: Autenticação confirmada', data);
        logger.debug('Socket autenticado:', data);
      });

      socketRef.current.on('authentication_error', (error) => {
        console.error('SocketContext: Erro de autenticação', error);
        logger.error('Erro de autenticação do socket:', error);
      });
    } else {
      console.log('SocketContext: Socket já existe, verificando conexão', {
        connected: socketRef.current.connected,
        id: socketRef.current.id
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

    // Validar dados essenciais antes de enviar
    if (!rideData.origin || !rideData.destination || !rideData.carType || !rideData.paymentMethod) {
      throw new Error('Dados de corrida incompletos');
    }

    // Calcular distância aproximada (em km) - simulação baseada em coordenadas
    const calculateDistance = (origin, destination) => {
      // Simulação simples de distância para Goiânia
      const baseDistance = Math.random() * 15 + 5; // Entre 5 e 20 km
      return Math.round(baseDistance * 100) / 100;
    };

    // Calcular duração aproximada (em minutos)
    const calculateDuration = (distance) => {
      // Assumindo velocidade média de 30 km/h no trânsito urbano
      const duration = (distance / 30) * 60;
      return Math.round(duration);
    };

    // Calcular preço baseado no tipo de carro e distância
    const calculatePrice = (distance, carType) => {
      const basePrices = {
        standard: 2.50,
        comfort: 3.50,
        premium: 5.00
      };
      const pricePerKm = basePrices[carType] || basePrices.standard;
      const basePrice = 4.00; // Taxa base
      const totalPrice = basePrice + (distance * pricePerKm);
      return Math.round(totalPrice * 100) / 100;
    };

    // Enriquecer dados da corrida com cálculos
    const distance = calculateDistance(rideData.origin, rideData.destination);
    const duration = calculateDuration(distance);
    const price = calculatePrice(distance, rideData.carType);

    const enrichedRideData = {
      ...rideData,
      distance,
      duration,
      price,
      passengerId: user._id
    };

    return new Promise((resolve, reject) => {
      logger.debug('Solicitando corrida com dados completos:', enrichedRideData);

      const timeout = setTimeout(() => {
        reject(new Error('Tempo esgotado ao solicitar corrida'));
      }, 15000);

      socketRef.current.emit('passenger:requestRide', enrichedRideData, (response) => {
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