const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthController = {
  async login(req, res) {
    try {
      const { phone, userType } = req.body;
      
      const user = await User.findOne({ phone, userType });
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const token = jwt.sign(
        { id: user._id, userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ token, user });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  async register(req, res) {
    try {
      const user = await User.create(req.body);

      const token = jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({ token, user });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
};

module.exports = AuthController; 