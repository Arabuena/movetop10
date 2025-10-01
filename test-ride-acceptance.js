// Script de teste para simular a aceitação de corrida pelo motorista
const io = require('socket.io-client');

// Configurações
const BACKEND_URL = 'http://localhost:5000';
const DRIVER_TOKEN = 'SEU_TOKEN_DE_MOTORISTA'; // Substitua pelo token real do motorista
const RIDE_ID = 'ID_DA_CORRIDA'; // Substitua pelo ID real da corrida

// Conectar ao servidor como motorista
console.log('Conectando ao servidor como motorista...');
const driverSocket = io(BACKEND_URL, {
  query: {
    token: DRIVER_TOKEN,
    userType: 'driver'
  }
});

// Eventos de conexão
driverSocket.on('connect', () => {
  console.log('Motorista conectado ao servidor com ID:', driverSocket.id);
  
  // Simular aceitação de corrida
  console.log(`Tentando aceitar corrida com ID: ${RIDE_ID}`);
  driverSocket.emit('driver:acceptRide', { rideId: RIDE_ID });
});

// Ouvir eventos de resposta
driverSocket.on('driver:rideAccepted', (data) => {
  console.log('Corrida aceita com sucesso!', data);
});

driverSocket.on('error', (error) => {
  console.error('Erro ao aceitar corrida:', error);
});

driverSocket.on('disconnect', () => {
  console.log('Motorista desconectado do servidor');
});

// Manter o script rodando por um tempo para receber respostas
setTimeout(() => {
  console.log('Finalizando teste...');
  driverSocket.disconnect();
  process.exit(0);
}, 10000);