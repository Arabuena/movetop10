require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const passengerRoutes = require('./routes/passenger');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Socket.IO events
require('./socket')(io);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/passenger', passengerRoutes);

// Função de inicialização
async function startServer() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app; 