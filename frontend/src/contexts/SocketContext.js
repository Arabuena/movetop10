import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SocketContext = createContext({});

// Criar uma única instância do socket fora do componente
let globalSocket = null;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setIsConnected(false);
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_API_URL, {
        autoConnect: false,
        transports: ['websocket']
      });
    }

    const handleConnect = () => {
      console.log('Socket conectado');
      setIsConnected(true);
      
      // Autenticar usuário
      socketRef.current.emit('authenticate', {
        userId: user._id,
        userType: user.userType
      }, (response) => {
        console.log('Autenticação:', response);
      });
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    if (!socketRef.current || !isConnected || user?.userType !== 'driver') return;

    console.log('Configurando listener de corridas para motorista');

    socketRef.current.on('driver:rideRequest', (ride) => {
      console.log('Nova solicitação de corrida recebida:', ride);
      
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-medium">Nova corrida disponível!</h3>
          <p className="text-sm text-gray-500 mt-1">
            De: {ride.origin.address}
          </p>
          <p className="text-sm text-gray-500">
            Para: {ride.destination.address}
          </p>
          <p className="text-sm font-medium mt-2">
            Valor: R$ {ride.price.toFixed(2)}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                console.log('Aceitando corrida:', ride._id);
                socketRef.current.emit('driver:acceptRide', { rideId: ride._id });
                toast.dismiss(t.id);
              }}
              className="flex-1 px-3 py-2 bg-99-primary text-white rounded-lg"
            >
              Aceitar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-2 text-gray-700 border rounded-lg"
            >
              Recusar
            </button>
          </div>
        </div>
      ), { duration: 20000 });
    });

    return () => {
      console.log('Removendo listener de corridas');
      socketRef.current.off('driver:rideRequest');
    };
  }, [socketRef.current, isConnected, user]);

  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.on('ride:accepted', (response) => {
      // Verificar se é passageiro antes de redirecionar
      if (user?.userType === 'passenger' && response.ride) {
        navigate(`/passenger/rides/${response.ride._id}`);
      }
    });

    return () => {
      socketRef.current.off('ride:accepted');
    };
  }, [socketRef.current, isConnected, user, navigate]);

  const requestRide = (rideData) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket não está conectado'));
        return;
      }

      console.log('Emitindo solicitação de corrida:', rideData);

      // Adicionar timeout para a requisição
      const timeout = setTimeout(() => {
        reject(new Error('Tempo limite excedido'));
      }, 30000);

      socketRef.current.emit('passenger:requestRide', rideData, (response) => {
        clearTimeout(timeout);
        console.log('Resposta da solicitação:', response);

        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.ride);
        }
      });
    });
  };

  const updateDriverStatus = (status) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket não está conectado'));
        return;
      }

      if (user?.userType !== 'driver') {
        reject(new Error('Usuário não é motorista'));
        return;
      }

      console.log('Emitindo driver:updateStatus:', status);
      socketRef.current.emit('driver:updateStatus', { status }, (response) => {
        console.log('Resposta do updateStatus:', response);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  };

  const acceptRide = (rideId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket não está conectado'));
        return;
      }

      socketRef.current.emit('driver:acceptRide', { rideId }, (response) => {
        try {
          // Verificar se a resposta é válida
          if (!response || !response.success || !response.ride) {
            throw new Error('Resposta inválida ao aceitar corrida');
          }

          const ride = response.ride;

          // Verificar se os dados necessários estão presentes
          if (!ride.passenger || !ride.passenger.name) {
            throw new Error('Dados do passageiro incompletos');
          }

          resolve(ride);
        } catch (error) {
          console.error('Erro ao aceitar corrida:', error);
          reject(error);
        }
      });
    });
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    requestRide,
    updateDriverStatus,
    acceptRide
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