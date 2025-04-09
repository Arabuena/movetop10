const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache com tempo de expiração
const tokenCache = new Map();
const CACHE_DURATION = 3600000; // 1 hora em milissegundos
const LOG_INTERVAL = 300000; // 5 minutos em milissegundos
let lastLogTime = Date.now() - LOG_INTERVAL; // Permite primeiro log

const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      tokenCache.delete(token);
    }
  }
};

// Limpa cache expirado a cada hora
setInterval(cleanExpiredCache, CACHE_DURATION);

// Verifica o token em cada requisição protegida
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca o usuário no banco de dados
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Adiciona o usuário ao objeto request
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = auth; 