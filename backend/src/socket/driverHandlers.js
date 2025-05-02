const { Driver, Ride } = require('../models');

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

const handleAcceptRide = async (socket, { rideId }, callback, { getSocketByUserId }) => {
  try {
    console.log('Driver tentando aceitar corrida:', rideId);
    
    // Verificar se o motorista está online
    const driver = await Driver.findById(socket.userId);
    if (!driver || driver.status !== 'online') {
      callback({ error: 'Motorista deve estar online para aceitar corridas' });
      return;
    }

    // Buscar e atualizar a corrida
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: 'pending' // Garantir que a corrida ainda está pendente
      },
      {
        $set: {
          status: 'accepted',
          driver: socket.userId
        }
      },
      {
        new: true, // Retornar o documento atualizado
        runValidators: true
      }
    ).populate('passenger driver');

    if (!ride) {
      callback({ error: 'Corrida não encontrada ou não está mais disponível' });
      return;
    }

    // Notificar passageiro
    const passengerSocket = getSocketByUserId(ride.passenger._id.toString());
    if (passengerSocket) {
      passengerSocket.emit('passenger:rideAccepted', { ride });
    }

    // Notificar outros motoristas
    socket.broadcast.emit('driver:rideUnavailable', { rideId });

    // Responder ao motorista
    callback({ 
      success: true,
      ride
    });

    console.log('Corrida aceita com sucesso:', rideId);
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    callback({ 
      error: 'Erro ao aceitar corrida',
      details: error.message 
    });
  }
};

// Registrar handlers
const driverHandlers = {
  'driver:acceptRide': handleAcceptRide,
  'driver:getActiveRide': handleGetActiveRide,
  // ... outros handlers ...
};

module.exports = driverHandlers; 