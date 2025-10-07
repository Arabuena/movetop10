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

// Função para calcular distância entre dois pontos usando fórmula de Haversine
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distância em km
  return distance;
};

// Handler para solicitar uma corrida
const handleRequestRide = async (socket, data, callback, { getSocketByUserId }) => {
  try {
    console.log('🚗 Solicitação de corrida recebida:', data);
    console.log('👤 Passageiro ID:', socket.userId);
    
    // Validar dados da corrida
    if (!data.origin || !data.destination || !data.price) {
      throw new Error('Dados da corrida incompletos');
    }

    // Buscar motoristas online e aprovados
    const availableDrivers = await User.find({
      userType: 'driver',
      isOnline: true,
      isAvailable: true,
      isApproved: true,
      location: { $exists: true } // Garantir que o motorista tem localização
    });

    console.log(`📋 Encontrados ${availableDrivers.length} motoristas disponíveis:`, 
      availableDrivers.map(d => ({ id: d._id, phone: d.phone })));

    if (availableDrivers.length === 0) {
      callback({ success: false, error: 'Nenhum motorista disponível no momento' });
      return;
    }

    // Calcular distâncias e encontrar o motorista mais próximo
    const driversWithDistance = availableDrivers.map(driver => {
      let distance = Infinity;
      
      if (driver.location && driver.location.coordinates && driver.location.coordinates.length === 2) {
        const driverLat = driver.location.coordinates[1]; // GeoJSON usa [lng, lat]
        const driverLng = driver.location.coordinates[0];
        const passengerLat = data.origin.lat;
        const passengerLng = data.origin.lng;
        
        distance = calculateDistance(passengerLat, passengerLng, driverLat, driverLng);
      }
      
      return {
        driver,
        distance
      };
    }).filter(item => item.distance !== Infinity); // Filtrar motoristas sem localização válida

    if (driversWithDistance.length === 0) {
      callback({ success: false, error: 'Nenhum motorista com localização disponível no momento' });
      return;
    }

    // Ordenar por distância e pegar o mais próximo
    driversWithDistance.sort((a, b) => a.distance - b.distance);
    const closestDriverData = driversWithDistance[0];
    const closestDriver = closestDriverData.driver;

    console.log(`🎯 Motorista mais próximo encontrado: ${closestDriver._id} (${closestDriver.phone}) - Distância: ${closestDriverData.distance.toFixed(2)}km`);

    // Criar a corrida
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
    console.log('✅ Corrida criada com ID:', ride._id);

    // Notificar apenas o motorista mais próximo
    const driverSocket = getSocketByUserId(closestDriver._id.toString());
    console.log(`🔍 Buscando socket para motorista mais próximo ${closestDriver._id}:`, driverSocket ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    
    let notifiedDrivers = 0;
    if (driverSocket) {
      console.log(`📤 Enviando eventos para motorista mais próximo ${closestDriver._id}`);
      
      // Emitir ambos os eventos
      driverSocket.emit('driver:rideRequest', {
        rideId: ride._id,
        passenger: socket.userId,
        origin: data.origin,
        destination: data.destination,
        price: data.price,
        distance: data.distance,
        duration: data.duration,
        distanceToPassenger: closestDriverData.distance.toFixed(2)
      });

      driverSocket.emit('driver:newRideAvailable', {
        rideId: ride._id,
        passenger: socket.userId,
        origin: data.origin,
        destination: data.destination,
        price: data.price,
        distance: data.distance,
        duration: data.duration,
        distanceToPassenger: closestDriverData.distance.toFixed(2)
      });
      
      notifiedDrivers = 1;
      console.log(`✅ Motorista mais próximo ${closestDriver._id} notificado (${closestDriverData.distance.toFixed(2)}km de distância)`);
    } else {
      console.log(`❌ Socket não encontrado para motorista mais próximo ${closestDriver._id}`);
    }

    console.log(`📊 Motorista mais próximo notificado: ${notifiedDrivers > 0 ? 'SIM' : 'NÃO'}`);

    callback({
      success: true,
      ride: ride,
      rideId: ride._id,
      message: notifiedDrivers > 0 
        ? `Corrida solicitada! O motorista mais próximo (${closestDriverData.distance.toFixed(2)}km) foi notificado.`
        : 'Corrida criada, mas não foi possível notificar o motorista mais próximo.',
      closestDriverDistance: closestDriverData.distance.toFixed(2)
    });

  } catch (error) {
    console.error('❌ Erro ao solicitar corrida:', error);
    callback({ success: false, error: error.message });
  }
};

// Handler para solicitar localização do motorista
const handleRequestDriverLocation = async (socket, { rideId }, callback, { getSocketByUserId }) => {
  try {
    console.log(`Passageiro ${socket.userId} solicitando localização do motorista para corrida ${rideId}`);
    
    // Buscar a corrida
    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) {
      throw new Error('Corrida não encontrada');
    }
    
    // Verificar se o passageiro é o dono da corrida
    if (ride.passenger.toString() !== socket.userId) {
      throw new Error('Você não tem permissão para acessar esta corrida');
    }
    
    // Verificar se há motorista atribuído
    if (!ride.driver) {
      throw new Error('Nenhum motorista atribuído a esta corrida');
    }
    
    // Buscar localização atual do motorista
    const driver = await User.findById(ride.driver._id);
    if (driver && driver.location && driver.location.coordinates) {
      const location = {
        lat: driver.location.coordinates[1],
        lng: driver.location.coordinates[0]
      };
      
      console.log(`Enviando localização atual do motorista ${driver._id} para passageiro ${socket.userId}:`, location);
      socket.emit('driver:location', { location });
    }
    
    if (callback) {
      callback({ success: true });
    }
  } catch (error) {
    console.error('Erro ao solicitar localização do motorista:', error);
    if (callback) {
      callback({ error: error.message });
    }
  }
};

// Adicionar aos handlers
const passengerHandlers = {
  'passenger:getActiveRide': handleGetActiveRide,
  'passenger:requestRide': handleRequestRide,
  'passenger:requestDriverLocation': handleRequestDriverLocation
};

module.exports = passengerHandlers;