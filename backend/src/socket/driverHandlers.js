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
    
    // Definir os campos a serem atualizados
    const updateFields = {
      status,
      isOnline: status === 'online',
      isAvailable: status === 'online'
    };
    
    // Atualizar o status do motorista no banco de dados
    const driver = await User.findByIdAndUpdate(
      socket.userId,
      { $set: updateFields },
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
      status: driver.status,
      isOnline: driver.isOnline,
      isAvailable: driver.isAvailable
    });
    
    console.log(`Status do motorista ${socket.userId} atualizado para ${status} (isOnline: ${updateFields.isOnline}, isAvailable: ${updateFields.isAvailable})`);
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

// Handler para receber solicitação de corrida
const handleRideRequest = async (socket, ride, callback) => {
  try {
    console.log(`Motorista ${socket.userId} recebeu solicitação de corrida ${ride._id}`);
    
    // Verificar se o motorista está disponível
    const driver = await User.findById(socket.userId);
    if (!driver || driver.status !== 'online') {
      console.log(`Motorista ${socket.userId} não está disponível para receber corridas`);
      return;
    }
    
    // Emitir evento para o frontend do motorista mostrar o botão de aceitar
    socket.emit('driver:newRideAvailable', { ride });
    
    if (callback) {
      callback({
        success: true
      });
    }
  } catch (error) {
    console.error('Erro ao processar solicitação de corrida:', error);
    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};

// Handler para cancelar corrida pelo motorista
const handleCancelRide = async (socket, { rideId }, callback, { getSocketByUserId }) => {
  try {
    console.log(`Motorista ${socket.userId} cancelando corrida ${rideId}`);
    
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Corrida não encontrada');
    }
    
    // Verificar se o motorista é o responsável pela corrida
    if (ride.driver && ride.driver.toString() !== socket.userId) {
      throw new Error('Você não tem permissão para cancelar esta corrida');
    }
    
    // Atualizar status da corrida
    ride.status = 'cancelled';
    ride.cancelledBy = 'driver';
    ride.cancellationReason = 'Cancelada pelo motorista';
    await ride.save();
    
    // Atualizar status do motorista para disponível
    const driver = await User.findById(socket.userId);
    if (driver) {
      driver.status = 'online';
      driver.isAvailable = true;
      await driver.save();
    }
    
    // Notificar o passageiro
    const passengerSocket = getSocketByUserId(ride.passenger.toString());
    if (passengerSocket && passengerSocket.connected) {
      console.log(`Notificando passageiro ${ride.passenger} sobre cancelamento da corrida ${ride._id}`);
      passengerSocket.emit('passenger:rideCancelled', { 
        ride, 
        reason: 'Cancelada pelo motorista',
        cancelledBy: 'driver'
      });
      passengerSocket.emit('ride:cancelled', { 
        ride, 
        reason: 'Cancelada pelo motorista',
        cancelledBy: 'driver'
      });
    } else {
      console.log(`Socket do passageiro ${ride.passenger} não encontrado ou não conectado`);
    }
    
    callback({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar corrida:', error);
    callback({ error: error.message });
  }
};

// Handler para atualizar localização do motorista
const handleUpdateLocation = async (socket, location, callback, { getSocketByUserId }) => {
  try {
    console.log(`Atualizando localização do motorista ${socket.userId}:`, location);
    
    // Validar dados de localização
    if (!location || !location.lat || !location.lng) {
      throw new Error('Dados de localização inválidos');
    }
    
    // Atualizar localização no banco de dados
    await User.findByIdAndUpdate(socket.userId, {
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      lastLocationUpdate: new Date()
    });
    
    // Buscar corrida ativa do motorista
    const activeRide = await Ride.findOne({
      driver: socket.userId,
      status: { $in: ['accepted', 'in_progress'] }
    });
    
    // Se há corrida ativa, notificar o passageiro sobre a nova localização
    if (activeRide) {
      const passengerSocket = getSocketByUserId(activeRide.passenger.toString());
      if (passengerSocket && passengerSocket.connected) {
        console.log(`Enviando localização do motorista para passageiro ${activeRide.passenger}`);
        passengerSocket.emit('driver:location', { location });
      }
    }
    
    if (callback) {
      callback({ success: true });
    }
  } catch (error) {
    console.error('Erro ao atualizar localização do motorista:', error);
    if (callback) {
      callback({ error: error.message });
    }
  }
};

// Registrar handlers
const driverHandlers = {
  'driver:acceptRide': handleAcceptRide,
  'driver:getActiveRide': handleGetActiveRide,
  'driver:updateStatus': handleUpdateStatus,
  'driver:rideRequest': handleRideRequest,
  'driver:cancelRide': handleCancelRide,
  'driver:updateLocation': handleUpdateLocation,
  'driver:newRideAvailable': handleRideRequest  // Adicionando um alias para garantir que o evento seja capturado
  // ... outros handlers ...
};

module.exports = driverHandlers;