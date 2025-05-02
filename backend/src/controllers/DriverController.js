const User = require('../models/User');
const Ride = require('../models/Ride');

const DriverController = {
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
      const rides = await Ride.find({ driver: req.user.id })
        .sort('-createdAt')
        .populate('passenger', 'name phone');
      
      return res.json(rides);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar corridas' });
    }
  },

  async getEarnings(req, res) {
    try {
      const rides = await Ride.find({
        driver: req.user.id,
        status: 'completed'
      });

      const earnings = rides.reduce((total, ride) => total + ride.price, 0);
      
      return res.json({ earnings, rides });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar ganhos' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      
      const validStatus = ['available', 'busy', 'offline'];
      if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { status } },
        { new: true }
      ).select('-__v');

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },

  getStatus: async (req, res) => {
    try {
      const driver = await User.findById(req.user.id).select('status');
      res.json({ status: driver.status });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar status' });
    }
  }
};

module.exports = DriverController; 