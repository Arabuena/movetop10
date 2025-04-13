const User = require('../models/User');
const Ride = require('../models/Ride');

const PassengerController = {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-__v');
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  async updateProfile(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: req.body },
        { new: true }
      ).select('-__v');
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  async getRides(req, res) {
    try {
      const rides = await Ride.find({ passenger: req.user.id })
        .sort('-createdAt')
        .populate('driver', 'name phone vehicle');
      
      return res.json(rides);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar corridas' });
    }
  },

  async requestRide(req, res) {
    try {
      const {
        origin,
        destination,
        price,
        distance,
        duration,
        paymentMethod
      } = req.body;

      // Validar dados da corrida
      if (!origin || !destination || !price || !distance || !duration || !paymentMethod) {
        return res.status(400).json({ error: 'Dados incompletos da corrida' });
      }

      // Criar nova corrida
      const ride = await Ride.create({
        passenger: req.user.id,
        origin,
        destination,
        price,
        distance,
        duration,
        paymentMethod,
        status: 'pending'
      });

      // Emitir evento via Socket.IO (será implementado)
      req.app.get('io').emit('newRide', ride);

      return res.status(201).json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao solicitar corrida' });
    }
  },

  async getRideDetails(req, res) {
    try {
      const ride = await Ride.findOne({
        _id: req.params.id,
        passenger: req.user.id
      }).populate('driver', 'name phone vehicle');

      if (!ride) {
        return res.status(404).json({ error: 'Corrida não encontrada' });
      }

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar detalhes da corrida' });
    }
  },

  async rateRide(req, res) {
    try {
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Avaliação inválida' });
      }

      const ride = await Ride.findOneAndUpdate(
        {
          _id: req.params.id,
          passenger: req.user.id,
          status: 'completed'
        },
        {
          'rating.driver': rating
        },
        { new: true }
      );

      if (!ride) {
        return res.status(404).json({ error: 'Corrida não encontrada' });
      }

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao avaliar corrida' });
    }
  },

  async getDemandMultiplier(req, res) {
    try {
      const { location } = req.body;
      
      // Implementar lógica real de cálculo do multiplicador
      // Por enquanto, vamos usar uma lógica simples baseada na hora do dia
      const hour = new Date().getHours();
      let multiplier = 1.0;

      // Horário de pico da manhã (7-9h)
      if (hour >= 7 && hour <= 9) {
        multiplier *= 1.3;
      }
      // Horário de pico da tarde (17-19h)
      else if (hour >= 17 && hour <= 19) {
        multiplier *= 1.4;
      }
      // Madrugada (22-6h)
      else if (hour >= 22 || hour <= 6) {
        multiplier *= 1.2;
      }

      return res.json({ multiplier });
    } catch (error) {
      console.error('Erro ao calcular multiplicador:', error);
      return res.status(500).json({ error: 'Erro ao calcular multiplicador' });
    }
  }
};

module.exports = PassengerController; 