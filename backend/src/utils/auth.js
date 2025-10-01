const jwt = require('jsonwebtoken');

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT a ser verificado
 * @returns {Promise<Object>} - Objeto com os dados decodificados do token
 */
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      
      // Adicionar userId e userType para uso no socket
      resolve({
        userId: decoded.id,
        userType: decoded.userType
      });
    });
  });
};

module.exports = {
  verifyToken
};