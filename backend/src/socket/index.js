const socketIO = require('socket.io');
const driverHandlers = require('./driverHandlers');
const passengerHandlers = require('./passengerHandlers');
const { verifyToken } = require('../utils/auth');

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
  });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = await verifyToken(token);
      socket.userId = decoded.userId;
      socket.userType = decoded.userType;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Armazenar sockets por userId
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('Usuário autenticado:', socket.userId, ', tipo:', socket.userType);
    console.log('Novo cliente conectado:', socket.userId, '(' + socket.userType + ')');
    console.log('Total de usuários conectados:', userSockets.size + 1);
    
    userSockets.set(socket.userId, socket);
    
    // Log dos IDs conectados
    const connectedIds = Array.from(userSockets.keys());
    console.log('IDs de usuários conectados:', connectedIds);

    // Função auxiliar para encontrar socket pelo userId
    const getSocketByUserId = (userId) => userSockets.get(userId);

    // Registrar handlers do motorista
    Object.entries(driverHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback) => {
        console.log(`Evento recebido (${socket.userType}): ${event}`);
        handler(socket, data, callback || (() => {}), { getSocketByUserId });
      });
    });

    // Registrar handlers do passageiro
    Object.entries(passengerHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback) => {
        console.log(`Evento recebido (${socket.userType}): ${event}`);
        handler(socket, data, callback || (() => {}), { getSocketByUserId });
      });
    });

    // Handler para teste de ping
    socket.on('test:ping', (data, callback) => {
      console.log(`Ping recebido de ${socket.userId} (${socket.userType}):`, data);
      if (callback) {
        callback({ success: true, message: 'Pong!' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.userId, '(' + socket.userType + ')');
      userSockets.delete(socket.userId);
      console.log('Total de usuários conectados após desconexão:', userSockets.size);
    });
  });

  return { io, getSocketByUserId: (userId) => userSockets.get(userId) };
};

module.exports = { setupSocket };