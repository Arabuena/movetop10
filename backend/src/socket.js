const Ride = require('./models/Ride');
const User = require('./models/User');

const handleDriverStatus = async (socket, { status }) => {
  try {
    if (socket.userType !== 'driver') {
      console.log('Tentativa de atualização de status por não-motorista:', socket.userType);
      return { error: 'Usuário não é motorista' };
    }

    console.log(`Atualizando status do motorista ${socket.userId} para ${status}`);
    const driver = await User.findByIdAndUpdate(
      socket.userId,
      { status: status === 'online' ? 'online' : 'offline' },
      { new: true }
    );

    if (!driver) {
      console.log('Motorista não encontrado:', socket.userId);
      return { error: 'Motorista não encontrado' };
    }

    console.log('Status atualizado com sucesso:', driver.status);
    socket.emit('driver:statusUpdated', { status: driver.status });
    
    return { success: true, status: driver.status };
  } catch (error) {
    console.error('Erro ao atualizar status do motorista:', error);
    return { error: 'Erro ao atualizar status' };
  }
};

module.exports = (io) => {
  // Configurações do Socket.IO
  io.engine.maxHttpBufferSize = 1e8; // 100 MB
  io.engine.pingTimeout = 60000; // 60 segundos
  io.engine.pingInterval = 25000; // 25 segundos

  // Limitar número de conexões por IP
  const connections = new Map();
  const MAX_CONNECTIONS_PER_IP = 5;

  io.use((socket, next) => {
    const clientIp = socket.handshake.address;
    const currentConnections = connections.get(clientIp) || 0;

    if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
      return next(new Error('Too many connections'));
    }

    connections.set(clientIp, currentConnections + 1);
    
    socket.on('disconnect', () => {
      const count = connections.get(clientIp);
      if (count > 1) {
        connections.set(clientIp, count - 1);
      } else {
        connections.delete(clientIp);
      }
    });

    next();
  });

  // Armazenar conexões de usuários
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Configurar socket individual
    socket.conn.on('packet', (packet) => {
      // Manter conexão viva
      if (packet.type === 'ping') {
        console.log('Heartbeat de', socket.id);
      }
    });

    // Autenticar usuário
    socket.on('authenticate', async ({ userId, userType }) => {
      try {
        console.log(`Autenticando usuário ${userId} (${userType})`);
        
        // Remover socket antigo se existir
        const existingSocket = userSockets.get(userId.toString());
        if (existingSocket) {
          console.log(`Removendo socket antigo do usuário ${userId}`);
          userSockets.delete(userId.toString());
        }

        // Armazenar o novo socket
        userSockets.set(userId.toString(), socket);
        socket.userId = userId;
        socket.userType = userType;

        // Se for motorista, atualizar status para disponível
        if (userType === 'driver') {
          const driver = await User.findByIdAndUpdate(
            userId, 
            { status: 'online' },
            { new: true }
          );
          console.log(`Motorista ${userId} autenticado e disponível:`, driver);
        }

        // Confirmar autenticação
        socket.emit('authenticated', { 
          success: true,
          userType,
          status: userType === 'driver' ? 'online' : undefined
        });

        console.log(`Usuário ${userId} (${userType}) autenticado com sucesso`);
      } catch (error) {
        console.error('Erro na autenticação:', error);
        socket.emit('authenticated', { 
          success: false, 
          error: error.message 
        });
      }
    });

    // Motorista atualiza status
    socket.on('driver:updateStatus', async ({ status }, callback) => {
      try {
        console.log(`Atualizando status do motorista ${socket.userId} para ${status}`);
        
        if (socket.userType !== 'driver') {
          throw new Error('Usuário não é motorista');
        }

        const driver = await User.findByIdAndUpdate(
          socket.userId,
          { status: status === 'online' ? 'online' : 'offline' },
          { new: true }
        );

        if (!driver) {
          throw new Error('Motorista não encontrado');
        }

        console.log('Status atualizado com sucesso:', driver.status);
        
        // Emitir evento de atualização
        socket.emit('driver:statusUpdated', { status: driver.status });
        
        // Responder ao cliente
        callback({ 
          success: true, 
          status: driver.status 
        });

      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        callback({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Passageiro solicita corrida
    socket.on('passenger:requestRide', async (rideData, callback) => {
      try {
        console.log('Nova solicitação de corrida recebida:', rideData);
        
        // Criar corrida
        const ride = await Ride.create({
          passenger: socket.userId,
          origin: {
            lat: rideData.origin.lat,
            lng: rideData.origin.lng,
            address: rideData.origin.address
          },
          destination: {
            lat: rideData.destination.lat,
            lng: rideData.destination.lng,
            address: rideData.destination.address
          },
          price: Number(rideData.price),
          distance: Number(rideData.distance),
          duration: Number(rideData.duration),
          paymentMethod: rideData.paymentMethod || 'cash',
          status: 'pending'
        });

        await ride.populate('passenger');
        console.log('Corrida criada:', ride);

        // Buscar motoristas disponíveis
        const availableDrivers = await User.find({
          userType: 'driver',
          status: 'online'
        });

        console.log(`Encontrados ${availableDrivers.length} motoristas disponíveis`);

        // Notificar cada motorista disponível
        let notifiedDrivers = 0;
        for (const driver of availableDrivers) {
          const driverSocket = userSockets.get(driver._id.toString());
          if (driverSocket && driverSocket.connected) {
            console.log(`Notificando motorista ${driver._id}`);
            driverSocket.emit('driver:rideRequest', ride);
            notifiedDrivers++;
          }
        }

        console.log(`${notifiedDrivers} motoristas notificados`);

        // Responder ao passageiro
        callback({ 
          ride,
          driversNotified: notifiedDrivers
        });

      } catch (error) {
        console.error('Erro ao processar solicitação:', error);
        callback({ error: error.message });
      }
    });

    // Motorista aceita corrida
    socket.on('driver:acceptRide', async ({ rideId }) => {
      try {
        console.log(`Motorista ${socket.userId} aceitando corrida ${rideId}`);
        
        // Verificar se o motorista está disponível
        const driver = await User.findById(socket.userId);
        if (!driver || driver.status !== 'online') {
          throw new Error('Motorista não está disponível');
        }

        // Atualizar corrida com status explícito
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { 
            status: 'accepted', // Garantir que o status está correto
            driver: socket.userId
          },
          { 
            new: true,
            populate: [
              { path: 'driver', select: 'name phone vehicle status' },
              { path: 'passenger', select: 'name phone' }
            ]
          }
        );

        console.log('Corrida aceita, status:', ride.status); // Log para debug

        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        // Verificar se os dados foram populados corretamente
        if (!ride.driver || !ride.passenger) {
          throw new Error('Erro ao carregar dados da corrida');
        }

        // Atualizar status do motorista
        await User.findByIdAndUpdate(socket.userId, { status: 'busy' });

        // Notificar passageiro
        const passengerSocket = userSockets.get(ride.passenger._id.toString());
        if (passengerSocket) {
          passengerSocket.emit('ride:accepted', { ride });
        }

        // Confirmar para o motorista com o status correto
        socket.emit('ride:accepted', {
          success: true,
          ride
        });

      } catch (error) {
        console.error('Erro ao aceitar corrida:', error);
        socket.emit('ride:error', {
          success: false,
          error: error.message || 'Erro ao aceitar corrida'
        });
      }
    });

    // Motorista chegou ao local
    socket.on('driver:arrived', async ({ rideId }, callback) => {
      try {
        console.log(`Motorista ${socket.userId} chegou ao local da corrida ${rideId}`);

        // Verificar se o motorista está associado a esta corrida
        const ride = await Ride.findById(rideId).populate('driver').populate('passenger');
        
        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        if (ride.driver._id.toString() !== socket.userId) {
          throw new Error('Motorista não autorizado');
        }

        // Atualizar status da corrida
        ride.status = 'collecting';
        await ride.save();

        // Notificar passageiro
        const passengerSocket = userSockets.get(ride.passenger._id.toString());
        if (passengerSocket) {
          passengerSocket.emit('ride:driverArrived', { 
            ride,
            message: 'Seu motorista chegou ao local!'
          });
        }

        // Notificar todos os interessados sobre a atualização
        socket.emit('ride:updated', ride);
        if (passengerSocket) {
          passengerSocket.emit('ride:updated', ride);
        }

        // Confirmar para o motorista
        callback({ 
          success: true, 
          ride,
          message: 'Passageiro notificado da sua chegada'
        });

      } catch (error) {
        console.error('Erro ao processar chegada do motorista:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao processar chegada'
        });
      }
    });

    // Motorista inicia corrida
    socket.on('driver:startRide', async ({ rideId }, callback) => {
      try {
        console.log(`Motorista ${socket.userId} iniciando corrida ${rideId}`);
        
        const ride = await Ride.findById(rideId).populate('driver').populate('passenger');
        
        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        if (ride.driver._id.toString() !== socket.userId) {
          throw new Error('Motorista não autorizado');
        }

        if (ride.status !== 'collecting') {
          throw new Error('Status inválido para iniciar corrida');
        }

        // Atualizar status da corrida
        ride.status = 'in_progress';
        await ride.save();

        // Notificar passageiro
        const passengerSocket = userSockets.get(ride.passenger._id.toString());
        if (passengerSocket) {
          passengerSocket.emit('ride:started', { ride });
        }

        // Notificar motorista
        callback({
          success: true,
          ride,
          message: 'Corrida iniciada com sucesso'
        });

      } catch (error) {
        console.error('Erro ao iniciar corrida:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao iniciar corrida'
        });
      }
    });

    // Finalizar corrida
    socket.on('driver:completeRide', async ({ rideId }) => {
      try {
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: 'completed' },
          { 
            new: true,
            populate: [
              { path: 'driver', select: 'name phone vehicle' },
              { path: 'passenger', select: 'name phone' }
            ]
          }
        );

        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        // Atualizar status do motorista
        await User.findByIdAndUpdate(socket.userId, { status: 'online' });

        // Notificar passageiro
        const passengerSocket = userSockets.get(ride.passenger._id.toString());
        if (passengerSocket) {
          passengerSocket.emit('ride:completed', ride);
        }

        socket.emit('ride:updated', ride);
      } catch (error) {
        console.error('Erro ao finalizar corrida:', error);
        socket.emit('ride:error', {
          success: false,
          error: error.message || 'Erro ao finalizar corrida'
        });
      }
    });

    // Motorista ou passageiro cancela a corrida
    socket.on('ride:cancel', async ({ rideId, reason }, callback) => {
      try {
        // Buscar e atualizar a corrida
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { 
            status: 'cancelled',
            cancelReason: reason,
            cancelledBy: socket.userId,
            cancelledAt: new Date()
          },
          { 
            new: true,
            populate: [
              { path: 'driver', select: 'name phone vehicle' },
              { path: 'passenger', select: 'name phone' }
            ]
          }
        );

        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        // Se foi cancelada pelo motorista, atualizar status dele para disponível
        if (socket.userType === 'driver') {
          await User.findByIdAndUpdate(socket.userId, { status: 'online' });
        }

        // Notificar o outro usuário (passageiro ou motorista)
        const otherUserId = socket.userType === 'driver' ? ride.passenger._id : ride.driver._id;
        const otherUserSocket = userSockets.get(otherUserId.toString());
        
        if (otherUserSocket) {
          otherUserSocket.emit('ride:cancelled', {
            ride,
            reason,
            cancelledBy: socket.userType
          });
        }

        // Confirmar o cancelamento
        if (callback) {
          callback({ 
            success: true,
            ride 
          });
        }

      } catch (error) {
        console.error('Erro ao cancelar corrida:', error);
        if (callback) {
          callback({ 
            success: false, 
            error: error.message || 'Erro ao cancelar corrida' 
          });
        }
      }
    });

    // Desconexão
    socket.on('disconnect', async () => {
      if (socket.userId) {
        console.log(`Usuário ${socket.userId} desconectado`);
        userSockets.delete(socket.userId.toString());

        // Se for motorista, atualizar status para offline
        if (socket.userType === 'driver') {
          try {
            await User.findByIdAndUpdate(socket.userId, { status: 'offline' });
            console.log(`Status do motorista ${socket.userId} atualizado para offline`);
          } catch (error) {
            console.error('Erro ao atualizar status do motorista:', error);
          }
        }
      }
    });

    // Adicionar reconexão
    socket.on('error', (error) => {
      console.error('Erro no socket:', error);
    });

    // Adicionar novo endpoint
    socket.on('driver:checkStatus', (data, callback) => {
      const status = {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType,
        isAuthenticated: !!socket.userId,
        isDriver: socket.userType === 'driver',
        isConnected: socket.connected,
        isInUserSockets: userSockets.has(socket.userId?.toString())
      };
      console.log('Status do motorista:', status);
      callback(status);
    });

    // Obter dados da corrida
    socket.on('ride:get', async ({ rideId }, callback) => {
      try {
        const ride = await Ride.findById(rideId)
          .populate('driver')
          .populate('passenger');

        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        // Verificar se o usuário tem permissão para ver esta corrida
        if (socket.userId !== ride.passenger._id.toString() && 
            socket.userId !== ride.driver?._id.toString()) {
          throw new Error('Sem permissão para ver esta corrida');
        }

        callback({ success: true, ride });
      } catch (error) {
        console.error('Erro ao buscar corrida:', error);
        callback({ 
          success: false, 
          error: error.message || 'Erro ao buscar corrida' 
        });
      }
    });

    // Atualização de localização do motorista
    socket.on('updateDriverLocation', async (location) => {
      try {
        if (!socket.userId) {
          throw new Error('Usuário não autenticado');
        }

        // Atualizar localização do motorista
        await User.findByIdAndUpdate(socket.userId, {
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        });

        // Se houver uma corrida em andamento, atualizar a localização na corrida
        const activeRide = await Ride.findOne({
          driver: socket.userId,
          status: { $in: ['accepted', 'collecting', 'in_progress'] }
        });

        if (activeRide) {
          activeRide.driverLocation = {
            lat: location.lat,
            lng: location.lng
          };
          await activeRide.save();

          // Emitir atualização para o passageiro
          const passengerSocket = userSockets.get(activeRide.passenger.toString());
          if (passengerSocket) {
            passengerSocket.emit('ride:driverLocation', {
              rideId: activeRide._id,
              location: location
            });
          }
        }

      } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        socket.emit('error', { 
          message: 'Erro ao atualizar localização',
          details: error.message 
        });
      }
    });

    // Motorista finaliza a corrida
    socket.on('driver:finishRide', async ({ rideId }, callback) => {
      try {
        console.log(`Motorista ${socket.userId} finalizando corrida ${rideId}`);

        // Verificar se o motorista está associado a esta corrida
        const ride = await Ride.findById(rideId).populate('driver').populate('passenger');
        
        if (!ride) {
          throw new Error('Corrida não encontrada');
        }

        if (ride.driver._id.toString() !== socket.userId) {
          throw new Error('Motorista não autorizado');
        }

        if (ride.status !== 'in_progress') {
          throw new Error('Corrida não está em andamento');
        }

        // Atualizar status da corrida
        ride.status = 'completed';
        await ride.save();

        // Atualizar status do motorista para disponível
        await User.findByIdAndUpdate(socket.userId, { status: 'online' });

        // Notificar passageiro
        const passengerSocket = userSockets.get(ride.passenger._id.toString());
        if (passengerSocket) {
          passengerSocket.emit('ride:completed', {
            ride,
            message: 'Sua corrida foi finalizada'
          });
        }

        // Confirmar para o motorista
        callback({
          success: true,
          ride,
          message: 'Corrida finalizada com sucesso'
        });

      } catch (error) {
        console.error('Erro ao finalizar corrida:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao finalizar corrida'
        });
      }
    });

    // Motorista busca histórico de corridas
    socket.on('driver:getRides', async (data, callback) => {
      try {
        console.log(`Buscando corridas do motorista ${socket.userId}`);
        
        const rides = await Ride.find({ 
          driver: socket.userId,
          status: { $in: ['completed', 'cancelled'] }
        })
        .select('origin destination status distance duration price estimatedPrice estimatedTime createdAt')
        .sort('-createdAt')
        .populate('passenger', 'name phone')
        .lean();

        console.log(`Encontradas ${rides.length} corridas`);

        callback({
          success: true,
          rides
        });
      } catch (error) {
        console.error('Erro ao buscar corridas:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao buscar corridas'
        });
      }
    });

    // Motorista busca dados de ganhos
    socket.on('driver:getEarnings', async (data, callback) => {
      try {
        console.log(`Buscando ganhos do motorista ${socket.userId}`);
        
        // Buscar todas as corridas completadas
        const rides = await Ride.find({ 
          driver: socket.userId,
          status: 'completed'
        }).sort('-createdAt');

        // Calcular totais
        const total = rides.reduce((sum, ride) => sum + ride.price, 0);
        const totalRides = rides.length;
        const averagePerRide = totalRides > 0 ? total / totalRides : 0;

        // Calcular média de avaliação
        const ratedRides = rides.filter(ride => ride.rating?.driver);
        const rating = ratedRides.length > 0 
          ? ratedRides.reduce((sum, ride) => sum + ride.rating.driver, 0) / ratedRides.length 
          : 5.0;

        // Agrupar por dia
        const dailyEarnings = rides.reduce((acc, ride) => {
          const date = new Date(ride.createdAt).toISOString().split('T')[0];
          
          if (!acc[date]) {
            acc[date] = { date, total: 0, rides: 0 };
          }
          
          acc[date].total += ride.price;
          acc[date].rides += 1;
          
          return acc;
        }, {});

        callback({
          success: true,
          earnings: {
            total,
            totalRides,
            averagePerRide,
            rating,
            dailyEarnings: Object.values(dailyEarnings).sort((a, b) => b.date.localeCompare(a.date))
          }
        });
      } catch (error) {
        console.error('Erro ao buscar ganhos:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao buscar ganhos'
        });
      }
    });

    // Passageiro busca histórico de corridas
    socket.on('passenger:getRides', async (data, callback) => {
      try {
        console.log(`Buscando corridas do passageiro ${socket.userId}`);
        
        const rides = await Ride.find({ 
          passenger: socket.userId,
          status: { $in: ['completed', 'cancelled'] }
        })
        .select('origin destination status distance duration price estimatedPrice estimatedTime createdAt rating')
        .sort('-createdAt')
        .populate('driver', 'name phone rating')
        .lean();

        console.log(`Encontradas ${rides.length} corridas`);

        callback({
          success: true,
          rides
        });
      } catch (error) {
        console.error('Erro ao buscar corridas:', error);
        callback({
          success: false,
          error: error.message || 'Erro ao buscar corridas'
        });
      }
    });

    // Motorista busca estatísticas
    socket.on('driver:getStats', async (data, callback) => {
      try {
        if (!socket.userId || socket.userType !== 'driver') {
          throw new Error('Não autorizado');
        }

        // Definir início e fim do dia atual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Buscar corridas completadas do dia
        const rides = await Ride.find({
          driver: socket.userId,
          status: 'completed',
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        });

        console.log('Estatísticas do motorista:', {
          userId: socket.userId,
          totalRides: rides.length,
          rides: rides.map(r => ({
            id: r._id,
            price: r.price,
            status: r.status,
            createdAt: r.createdAt
          }))
        });

        // Calcular ganhos totais
        const totalEarnings = rides.reduce((sum, ride) => {
          // Garantir que o preço seja um número
          const price = Number(ride.price) || 0;
          return sum + price;
        }, 0);

        const stats = {
          totalRides: rides.length,
          totalEarnings: totalEarnings,
          rating: 5 // Implementar cálculo de rating depois
        };

        callback({
          success: true,
          stats
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        callback({
          success: false,
          error: error.message
        });
      }
    });
  });

  // Limpar conexões inativas periodicamente
  setInterval(() => {
    for (const [userId, socket] of userSockets.entries()) {
      if (!socket.connected) {
        console.log(`Removendo socket inativo: ${userId}`);
        userSockets.delete(userId);
      }
    }
  }, 30000);
}; 