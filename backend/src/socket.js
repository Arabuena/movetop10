const Ride = require('./models/Ride');
const driverHandlers = require('./socket/driverHandlers');
const passengerHandlers = require('./socket/passengerHandlers');
const jwt = require('jsonwebtoken');

const setupSocket = (io) => {
  // Middleware de autenticação
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.userType;
      console.log(`Usuário autenticado: ${socket.userId}, tipo: ${socket.userType}`);
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Armazenar sockets por userId
  const userSockets = new Map();
  
  // Broadcast seguro para todos os motoristas conectados
  const broadcastToDrivers = (event, payload) => {
    try {
      const sockets = Array.from(userSockets.entries());
      const driverSockets = sockets.filter(([id, s]) => s && s.connected && s.userType === 'driver');
      console.log(`Broadcast '${event}' para ${driverSockets.length} motoristas conectados. IDs: ${driverSockets.map(([id]) => id).join(', ')}`);
      driverSockets.forEach(([id, s]) => {
        try {
          s.emit(event, payload);
        } catch (err) {
          console.error(`Falha ao emitir '${event}' para motorista ${id}:`, err.message);
        }
      });
    } catch (err) {
      console.error('Erro no broadcast para motoristas:', err);
    }
  };

  io.on('connection', (socket) => {
    console.log(`Novo cliente conectado: ${socket.userId} (${socket.userType})`);
    
    // Garantir que o userId seja uma string para consistência
    const userId = String(socket.userId);
    userSockets.set(userId, socket);
    
    console.log(`Total de usuários conectados: ${userSockets.size}`);
    console.log(`IDs de usuários conectados: ${Array.from(userSockets.keys()).join(', ')}`);

    // Registrar handlers do motorista apenas para conexões de motoristas
    if (socket.userType === 'driver') {
      Object.entries(driverHandlers).forEach(([event, handler]) => {
        socket.on(event, (data, callback = () => {}) => {
          console.log(`Evento recebido (${socket.userType}): ${event}`);
          handler(socket, data, callback, {
            getSocketByUserId: (userId) => {
              const userIdStr = String(userId);
              const userSocket = userSockets.get(userIdStr);
              console.log(`Buscando socket para usuário ${userIdStr}: ${userSocket ? 'encontrado' : 'não encontrado'}`);
              return userSocket;
            },
            broadcastToDrivers,
            listConnectedUserIds: () => Array.from(userSockets.keys())
          });
        });
      });
    }

    // Registrar handlers do passageiro apenas para conexões de passageiros
    if (socket.userType === 'passenger') {
      Object.entries(passengerHandlers).forEach(([event, handler]) => {
        socket.on(event, (data, callback = () => {}) => {
          console.log(`Evento recebido (${socket.userType}): ${event}`);
          handler(socket, data, callback, {
            getSocketByUserId: (userId) => {
              const userIdStr = String(userId);
              const userSocket = userSockets.get(userIdStr);
              console.log(`Buscando socket para usuário ${userIdStr}: ${userSocket ? 'encontrado' : 'não encontrado'}`);
              return userSocket;
            },
            broadcastToDrivers,
            listConnectedUserIds: () => Array.from(userSockets.keys())
          });
        });
      });
    }

    // Passageiro cancela corrida
    socket.on('passenger:cancelRide', async ({ rideId }, callback) => {
      try {
        console.log(`Passageiro ${socket.userId} cancelando corrida ${rideId}`);
        
        const ride = await Ride.findById(rideId);
        if (!ride) {
          throw new Error('Corrida não encontrada');
        }
        
        // Verificar se o passageiro é o dono da corrida
        if (ride.passenger.toString() !== socket.userId) {
          throw new Error('Você não tem permissão para cancelar esta corrida');
        }
        
        // Atualizar status da corrida
        ride.status = 'cancelled';
        await ride.save();
        
        // Notificar o motorista, se houver
        if (ride.driver) {
          const driverSocket = userSockets.get(ride.driver.toString());
          if (driverSocket && driverSocket.connected) {
            console.log(`Notificando motorista ${ride.driver} sobre cancelamento da corrida ${ride._id}`);
            driverSocket.emit('driver:rideCancelled', { ride });
          } else {
            console.log(`Socket do motorista ${ride.driver} não encontrado ou não conectado`);
          }
        }
        
        callback({ success: true });
      } catch (error) {
        console.error('Erro ao cancelar corrida:', error);
        callback({ error: error.message });
      }
    });

    // Handler para evento authenticate (compatibilidade com frontend)
    socket.on('authenticate', (data) => {
      console.log(`Evento authenticate recebido de ${socket.userId} (${socket.userType}):`, data);
      // Emitir confirmação de autenticação
      socket.emit('authenticated', {
        success: true,
        userId: socket.userId,
        userType: socket.userType,
        message: 'Usuário autenticado com sucesso'
      });
    });

    // Evento para testar a comunicação
    socket.on('test:ping', (data, callback) => {
      console.log(`Ping recebido de ${socket.userId} (${socket.userType}): ${JSON.stringify(data)}`);
      callback({ success: true, message: 'Pong!', timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.userId} (${socket.userType})`);
      const userId = String(socket.userId);
      userSockets.delete(userId);
      console.log(`Total de usuários conectados após desconexão: ${userSockets.size}`);
    });
  });

  // Função auxiliar para encontrar socket pelo userId
  const getSocketByUserId = (userId) => {
    const userIdStr = String(userId);
    const userSocket = userSockets.get(userIdStr);
    console.log(`Buscando socket para usuário ${userIdStr}: ${userSocket ? 'encontrado' : 'não encontrado'}`);
    return userSocket;
  };

  return { io, getSocketByUserId };
};

module.exports = setupSocket;