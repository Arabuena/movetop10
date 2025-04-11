const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('Nova conexão WebSocket');

    // Autenticação
    const token = req.url.split('token=')[1];
    if (!token) {
      ws.close();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
    } catch (err) {
      ws.close();
      return;
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      console.log('Conexão fechada');
    });
  });

  return wss;
};

module.exports = setupWebSocket; 