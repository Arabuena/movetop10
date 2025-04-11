const sendNotification = async (userId, notification) => {
  try {
    // Aqui você implementaria a lógica real de notificações
    // Pode ser usando WebSocket, Firebase Cloud Messaging, etc.
    console.log('Enviando notificação para usuário:', userId, notification);
    
    // Exemplo de estrutura para implementação futura com WebSocket
    // if (global.io) {
    //   global.io.to(userId).emit('notification', notification);
    // }
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
};

module.exports = { sendNotification }; 