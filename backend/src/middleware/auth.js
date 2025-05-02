const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Verificar se o token existe no header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Extrair o token do header (Bearer token)
    const [, token] = authHeader.split(' ');

    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Verificar tipo de usuário
    if (user.userType !== decoded.userType) {
      return res.status(401).json({ error: 'Tipo de usuário inválido' });
    }

    // Adicionar usuário à requisição
    req.user = user;
    
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}; 