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

// Adicionar aos handlers
const passengerHandlers = {
  // ... outros handlers ...
  'passenger:getActiveRide': handleGetActiveRide,
}; 