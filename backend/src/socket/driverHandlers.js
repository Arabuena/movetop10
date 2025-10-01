const User = require('../models/User');
const Ride = require('../models/Ride');

const handleGetActiveRide = async (socket, data, callback) => {
  try {
    const driverId = socket.userId;
    
    // Buscar corrida ativa do motorista
    const activeRide = await Ride.findOne({
      driver: driverId,
      status: { $in: ['accepted', 'in_progress'] }
    }).populate('passenger');

    if (!activeRide) {
      callback({ ride: null });
      return;
    }

    callback({ ride: activeRide });
  } catch (error) {
    console.error('Erro ao buscar corrida ativa:', error);
    callback({ error: 'Erro ao buscar corrida ativa' });
  }
};

// Handler para atualizar o status do motorista
const handleUpdateStatus = async (socket, { status }, callback) => {
  try {
    console.log(`Motorista ${socket.userId} alterando status para ${status}`);
    
    // Verificar se o status é válido
    const validStatus = ['online', 'offline'];
    if (!validStatus.includes(status)) {
      throw new Error('Status inválido');
    }
    
    // Atualizar o status do motorista no banco de dados
    const driver = await User.findByIdAndUpdate(
      socket.userId,
      { $set: { status } },
      { new: true }
    );
    
    if (!driver) {
      throw new Error('Motorista não encontrado');
    }
    
    // Emitir evento de status atualizado
    socket.emit('driver:statusUpdated', { status });
    
    // Responder ao cliente
    callback({
      success: true,
      status: driver.status
    });
    
    console.log(`Status do motorista ${socket.userId} atualizado para ${status}`);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    socket.emit('driver:statusError', { message: error.message });
    callback({
      success: false,
      error: error.message
    });
  }
};

// Modificar a função handleAcceptRide para garantir que o evento seja emitido corretamente
const handleAcceptRide = async (socket, { rideId }, callback, { getSocketByUserId }) => {
  try {
    console.log(`Motorista ${socket.userId} aceitando corrida ${rideId}`);
    
    // Verificar se o motorista está disponível
    const driver = await User.findById(socket.userId);
    if (!driver || driver.status !== 'online') {
      throw new Error('Motorista não está disponível');
    }

    // Buscar a corrida
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Corrida não encontrada');
    }

    if (ride.status !== 'pending') {
      throw new Error('Esta corrida já foi aceita por outro motorista');
    }

    // Atualizar a corrida
    ride.driver = socket.userId;
    ride.status = 'accepted';
    await ride.save();

    // Atualizar o status do motorista
    driver.status = 'busy';
    await driver.save();

    // Notificar o passageiro
    const passengerSocket = getSocketByUserId(ride.passenger.toString());
    if (passengerSocket) {
      console.log(`Notificando passageiro ${ride.passenger} sobre aceitação da corrida`);
      passengerSocket.emit('passenger:rideAccepted', { ride });
      passengerSocket.emit('ride:accepted', { ride });
    } else {
      console.log(`Socket do passageiro ${ride.passenger} não encontrado`);
    }

    // Responder ao motorista
    await ride.populate('passenger', 'name phone');
    callback({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    callback({
      success: false,
      error: error.message
    });
  }
};

// Registrar handlers
const driverHandlers = {
  'driver:acceptRide': handleAcceptRide,
  'driver:getActiveRide': handleGetActiveRide,
  'driver:updateStatus': handleUpdateStatus,
  // ... outros handlers ...
};

module.exports = driverHandlers;