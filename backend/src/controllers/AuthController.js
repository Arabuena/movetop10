const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthController = {
  async login(req, res) {
    try {
      console.log('📝 Tentativa de login:', {
        phone: req.body.phone,
        userType: req.body.userType
      });
      
      const { phone, userType } = req.body;
      
      const user = await User.findOne({ phone, userType });
      console.log('🔍 Usuário encontrado:', user ? 'Sim' : 'Não');
      
      if (!user) {
        console.log('❌ Login falhou: Usuário não encontrado');
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const token = jwt.sign(
        { id: user._id, userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Login bem-sucedido:', {
        userId: user._id,
        userType: user.userType
      });

      return res.json({ token, user });
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
    }
  },

  async register(req, res) {
    try {
      console.log('📝 Tentativa de registro:', {
        phone: req.body.phone,
        userType: req.body.userType,
        name: req.body.name
      });

      // Verificar se usuário já existe
      const existingUser = await User.findOne({
        phone: req.body.phone,
        userType: req.body.userType
      });

      if (existingUser) {
        console.log('❌ Registro falhou: Usuário já existe');
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      // Criar novo usuário
      const user = await User.create(req.body);
      console.log('✅ Usuário criado:', {
        userId: user._id,
        userType: user.userType
      });

      const token = jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Verificar se o usuário foi realmente salvo
      const savedUser = await User.findById(user._id);
      console.log('🔍 Verificação pós-salvamento:', {
        encontrado: !!savedUser,
        id: savedUser?._id
      });

      console.log('✅ Registro completo com sucesso');
      return res.status(201).json({ token, user });
    } catch (error) {
      console.error('❌ Erro no registro:', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        error: 'Erro ao criar usuário', 
        details: error.message 
      });
    }
  }
};

module.exports = AuthController; 