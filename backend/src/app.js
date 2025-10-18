require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const passengerRoutes = require('./routes/passenger');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const httpServer = createServer(app);
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3012',
  'http://localhost:3013',
  'http://localhost:3015',
  'http://localhost:3010',
  'http://localhost:3011',
  'http://localhost:3055',
  'http://localhost:3056',
  'http://localhost:3030',
  'http://localhost:3031',
  'http://localhost:3100',
  'https://movetop10.onrender.com'
];
const originRegexDev3030 = /^http:\/\/\d{1,3}(\.\d{1,3}){3}:3030$/;
const originRegexDev3100 = /^http:\/\/\d{1,3}(\.\d{1,3}){3}:3100$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || (isDev && (originRegexDev3030.test(origin) || originRegexDev3100.test(origin)))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};
const io = new Server(httpServer, { cors: corsOptions });

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// Servir arquivos enviados (avatars)
// Corrige caminho: de '../../uploads' para '../uploads' (backend/uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.IO events
require('./socket')(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/passenger', passengerRoutes);

// Adicionar antes das outras rotas
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
    }
  });
}

// Função de inicialização
async function startServer() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;