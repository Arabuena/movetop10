const socketIO = require('socket.io');
const Ride = require('./models/Ride');
const driverHandlers = require('./socket/driverHandlers');
const passengerHandlers = require('./socket/passengerHandlers');
const jwt = require('jsonwebtoken');

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
  });

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
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Armazenar sockets por userId
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.userId);
    userSockets.set(socket.userId, socket);

    // Registrar handlers do motorista
    Object.entries(driverHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback = () => {}) => {
        handler(socket, data, callback, { getSocketByUserId: (userId) => userSockets.get(userId) });
      });
    });

    // Registrar handlers do passageiro
    Object.entries(passengerHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback = () => {}) => {
        handler(socket, data, callback, { getSocketByUserId: (userId) => userSockets.get(userId) });
      });
    });

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
            driverSocket.emit('driver:rideCancelled', { ride });
          }
        }
        
        callback({ success: true });
      } catch (error) {
        console.error('Erro ao cancelar corrida:', error);
        callback({ error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.userId);
      userSockets.delete(socket.userId);
    });
  });

  // Função auxiliar para encontrar socket pelo userId
  const getSocketByUserId = (userId) => userSockets.get(userId);

  return { io, getSocketByUserId };
};

module.exports = setupSocket;