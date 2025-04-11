const Ride = require('../models/Ride');
const User = require('../models/User');
const { calculatePrice } = require('../utils/priceCalculator');
const { sendNotification } = require('../utils/notifications');

const rideController = {
  // Buscar corridas disponíveis para motoristas
  async getAvailableRides(req, res) {
    try {
      const rides = await Ride.find({
        status: 'PENDING',
        driver: null
      }).populate('passenger', 'name');

      res.json(rides);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Buscar corrida atual do usuário
  async getCurrentRide(req, res) {
    try {
      const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'];
      
      const ride = await Ride.findOne({
        $or: [
          { passenger: req.user.id },
          { driver: req.user.id }
        ],
        status: { $in: activeStatuses }
      }).populate('passenger driver', 'name phone');

      if (!ride) {
        return res.status(404).json({ message: 'Nenhuma corrida ativa encontrada' });
      }

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Solicitar uma nova corrida
  async requestRide(req, res) {
    try {
      console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
      console.log('Usuário autenticado:', req.user);

      const {
        origin,
        destination,
        distance,
        duration,
        paymentMethod,
        price
      } = req.body;

      // Validação dos dados
      if (!origin?.coordinates || !destination?.coordinates) {
        console.error('Coordenadas inválidas:', { origin, destination });
        return res.status(400).json({ 
          message: 'Coordenadas de origem e destino são obrigatórias' 
        });
      }

      // Valida os números
      if (typeof distance !== 'number' || typeof duration !== 'number' || typeof price !== 'number') {
        console.error('Valores numéricos inválidos:', { distance, duration, price });
        return res.status(400).json({
          message: 'Distância, duração e preço devem ser números válidos'
        });
      }

      // Cria a corrida
      const rideData = {
        passenger: req.user._id,
        origin: {
          address: origin.address,
          coordinates: origin.coordinates.map(Number)
        },
        destination: {
          address: destination.address,
          coordinates: destination.coordinates.map(Number)
        },
        distance: Number(distance),
        duration: Number(duration),
        price: Number(price),
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        status: 'PENDING'
      };

      console.log('Dados da corrida a ser criada:', JSON.stringify(rideData, null, 2));

      const ride = new Ride(rideData);

      // Valida o modelo antes de salvar
      const validationError = ride.validateSync();
      if (validationError) {
        console.error('Erro de validação:', validationError);
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: Object.values(validationError.errors).map(err => err.message)
        });
      }

      await ride.save();
      console.log('Corrida salva com sucesso:', JSON.stringify(ride, null, 2));

      // Popula os dados do passageiro
      await ride.populate('passenger', 'name email phone');

      // Converte o documento do Mongoose para um objeto plano
      const rideObject = ride.toObject();

      // Garante que o ID está disponível em ambos os formatos
      rideObject.id = rideObject._id;

      res.status(201).json({ 
        message: 'Corrida solicitada com sucesso',
        ride: rideObject
      });
    } catch (error) {
      console.error('Erro detalhado ao solicitar corrida:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        message: 'Erro ao solicitar corrida',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Motorista aceita a corrida
  async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;

      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== 'PENDING') {
        return res.status(400).json({ message: 'Corrida não disponível' });
      }

      ride.driver = driverId;
      ride.status = 'ACCEPTED';
      await ride.save();

      // Notificar passageiro
      sendNotification(ride.passenger, {
        type: 'RIDE_ACCEPTED',
        rideId: ride._id
      });

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Motorista chegou ao local de partida
  async arrivedAtPickup(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      ride.status = 'ARRIVED';
      await ride.save();

      sendNotification(ride.passenger, {
        type: 'DRIVER_ARRIVED',
        rideId: ride._id
      });

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Iniciar a corrida
  async startRide(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      ride.status = 'IN_PROGRESS';
      ride.startTime = new Date();
      await ride.save();

      sendNotification(ride.passenger, {
        type: 'RIDE_STARTED',
        rideId: ride._id
      });

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Finalizar a corrida
  async completeRide(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);

      if (!ride || ride.driver.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      ride.status = 'COMPLETED';
      ride.endTime = new Date();
      await ride.save();

      sendNotification(ride.passenger, {
        type: 'RIDE_COMPLETED',
        rideId: ride._id
      });

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Cancelar a corrida
  async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      // Verifica se é o passageiro que está cancelando
      if (userRole === 'PASSENGER' && ride.passenger.toString() !== userId) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      // Verifica se a corrida pode ser cancelada
      const cancelableStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED'];
      if (!cancelableStatuses.includes(ride.status)) {
        return res.status(400).json({ 
          message: 'Não é possível cancelar a corrida neste momento',
          currentStatus: ride.status
        });
      }

      // Atualiza o status da corrida
      ride.status = 'CANCELLED';
      ride.cancelReason = reason;
      ride.cancelledBy = userRole;
      ride.endTime = new Date();
      await ride.save();

      // Se houver um motorista, notifica-o do cancelamento
      if (ride.driver) {
        sendNotification(ride.driver, {
          type: 'RIDE_CANCELLED',
          rideId: ride._id,
          message: 'O passageiro cancelou a corrida',
          reason
        });
      }

      res.json({
        message: 'Corrida cancelada com sucesso',
        ride
      });
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Avaliar a corrida
  async rateRide(req, res) {
    try {
      const { rideId } = req.params;
      const { rating, comment } = req.body;
      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      const isPassenger = ride.passenger.toString() === req.user.id;
      const isDriver = ride.driver.toString() === req.user.id;

      if (!isPassenger && !isDriver) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      if (isPassenger) {
        ride.rating.driver = rating;
      } else {
        ride.rating.passenger = rating;
      }

      ride.rating.comment = comment;
      await ride.save();

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Verificar e retornar corrida ativa
  async checkActiveRide(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Estados que consideramos ativos
      const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'];
      
      // Busca corrida ativa baseada no papel do usuário
      const query = {
        status: { $in: activeStatuses }
      };

      // Adiciona condição específica baseada no papel do usuário
      if (userRole === 'DRIVER') {
        query.driver = userId;
      } else {
        query.passenger = userId;
      }

      const activeRide = await Ride.findOne(query)
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone location')
        .populate('pickup destination');

      if (!activeRide) {
        return res.status(404).json({ 
          message: 'Nenhuma corrida ativa encontrada',
          status: 'NO_ACTIVE_RIDE'
        });
      }

      // Adiciona informações contextuais baseadas no estado da corrida
      const rideInfo = {
        ride: activeRide,
        userRole: userRole,
        actions: getRideActions(activeRide.status, userRole),
        nextSteps: getNextSteps(activeRide.status, userRole)
      };

      res.json(rideInfo);
    } catch (error) {
      console.error('Erro ao verificar corrida ativa:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Atualizar status da corrida
  async updateRideStatus(req, res) {
    try {
      const { rideId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Corrida não encontrada' });
      }

      // Verifica permissões
      if (userRole === 'DRIVER' && ride.driver.toString() !== userId) {
        return res.status(403).json({ message: 'Não autorizado' });
      }
      if (userRole === 'PASSENGER' && ride.passenger.toString() !== userId) {
        return res.status(403).json({ message: 'Não autorizado' });
      }

      // Valida a transição de estado
      if (!isValidStatusTransition(ride.status, status, userRole)) {
        return res.status(400).json({ 
          message: 'Transição de estado inválida',
          currentStatus: ride.status,
          requestedStatus: status
        });
      }

      ride.status = status;
      if (status === 'IN_PROGRESS') {
        ride.startTime = new Date();
      } else if (status === 'COMPLETED') {
        ride.endTime = new Date();
      }

      await ride.save();

      // Notifica a outra parte sobre a mudança de status
      const notifyUserId = userRole === 'DRIVER' ? ride.passenger : ride.driver;
      sendNotification(notifyUserId, {
        type: 'RIDE_STATUS_UPDATED',
        rideId: ride._id,
        status: status
      });

      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

// Funções auxiliares
function getRideActions(status, userRole) {
  const actions = {
    DRIVER: {
      PENDING: ['accept'],
      ACCEPTED: ['arrive', 'cancel'],
      ARRIVED: ['start', 'cancel'],
      IN_PROGRESS: ['complete']
    },
    PASSENGER: {
      PENDING: ['cancel'],
      ACCEPTED: ['cancel'],
      ARRIVED: ['cancel'],
      IN_PROGRESS: ['emergency']
    }
  };

  return actions[userRole][status] || [];
}

function getNextSteps(status, userRole) {
  const steps = {
    DRIVER: {
      PENDING: 'Aceite a corrida para iniciar',
      ACCEPTED: 'Dirija até o local de partida',
      ARRIVED: 'Aguarde o passageiro e inicie a corrida',
      IN_PROGRESS: 'Leve o passageiro ao destino'
    },
    PASSENGER: {
      PENDING: 'Aguarde um motorista aceitar sua corrida',
      ACCEPTED: 'O motorista está a caminho',
      ARRIVED: 'O motorista chegou ao local de partida',
      IN_PROGRESS: 'Em rota para o destino'
    }
  };

  return steps[userRole][status] || '';
}

function isValidStatusTransition(currentStatus, newStatus, userRole) {
  const validTransitions = {
    DRIVER: {
      PENDING: ['ACCEPTED'],
      ACCEPTED: ['ARRIVED', 'CANCELLED'],
      ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED']
    },
    PASSENGER: {
      PENDING: ['CANCELLED'],
      ACCEPTED: ['CANCELLED'],
      ARRIVED: ['CANCELLED'],
      IN_PROGRESS: ['CANCELLED']
    }
  };

  return validTransitions[userRole][currentStatus]?.includes(newStatus) || false;
}

module.exports = rideController; 