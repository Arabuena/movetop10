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
    console.log('Novo cliente conectado:', socket.userId);
    userSockets.set(socket.userId, socket);

    // Registrar handlers do motorista
    Object.entries(driverHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback) => {
        handler(socket, data, callback || (() => {}));
      });
    });

    // Registrar handlers do passageiro
    Object.entries(passengerHandlers).forEach(([event, handler]) => {
      socket.on(event, (data, callback) => {
        handler(socket, data, callback || (() => {}));
      });
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

module.exports = { setupSocket }; 