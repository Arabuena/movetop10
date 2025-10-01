const User = require('../models/User');
const Ride = require('../models/Ride');

const handleGetActiveRide = async (socket, data, callback) => {
  try {
    const passengerId = socket.userId;
    
    // Buscar corrida ativa do passageiro
    const activeRide = await Ride.findOne({
      passenger: passengerId,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    }).populate('driver');

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

// Handler para solicitar uma corrida
const handleRequestRide = async (socket, data, callback, { getSocketByUserId }) => {
  try {
    console.log('Solicitação de corrida recebida:', data);
    
    // Validar dados da corrida
    if (!data.origin || !data.destination || !data.price) {
      throw new Error('Dados da corrida incompletos');
    }

    // Criar nova corrida no banco de dados
    const ride = new Ride({
      passenger: socket.userId,
      origin: data.origin,
      destination: data.destination,
      price: data.price,
      distance: data.distance,
      duration: data.duration,
      paymentMethod: data.paymentMethod,
      status: 'pending'
    });

    await ride.save();
    console.log(`Nova corrida criada: ${ride._id}`);

    // Buscar motoristas disponíveis
    const availableDrivers = await User.find({
      userType: 'driver',
      isOnline: true,
      isAvailable: true
    }).select('_id');

    console.log(`Motoristas disponíveis encontrados: ${availableDrivers.length}`);
    console.log('IDs dos motoristas disponíveis:', availableDrivers.map(d => d._id));

    // Notificar motoristas disponíveis
    let notifiedDrivers = 0;
    for (const driver of availableDrivers) {
      const driverId = String(driver._id);
      console.log(`Tentando notificar motorista com ID: ${driverId}`);
      
      const driverSocket = getSocketByUserId(driverId);
      if (driverSocket) {
        console.log(`Socket do motorista ${driverId} encontrado, enviando notificação`);
        
        // Enviar evento para ambos os nomes de eventos para garantir compatibilidade
        driverSocket.emit('driver:rideRequest', {
          ...ride.toObject(),
          passenger: {
            _id: socket.userId
          }
        });
        
        driverSocket.emit('driver:newRideAvailable', { 
          ride: {
            ...ride.toObject(),
            passenger: {
              _id: socket.userId
            }
          }
        });
        
        notifiedDrivers++;
        console.log(`Notificação enviada com sucesso para motorista ${driverId}`);
      } else {
        console.log(`Socket do motorista ${driverId} não encontrado`);
      }
    }

    console.log(`Total de motoristas notificados: ${notifiedDrivers}`);

    callback({ 
      success: true, 
      ride: ride.toObject(),
      notifiedDrivers
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de corrida:', error);
    callback({ error: error.message });
  }
};

// Adicionar aos handlers
const passengerHandlers = {
  'passenger:getActiveRide': handleGetActiveRide,
  'passenger:requestRide': handleRequestRide
};

module.exports = passengerHandlers;