const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizePhone = (phone) => {
  // Remove todos os caracteres não numéricos
  let normalized = phone.replace(/\D/g, '');
  
  // Garantir que tenha 11 dígitos
  if (normalized.length === 10) {
    // Adicionar o 9 depois do DDD
    normalized = normalized.slice(0, 2) + '9' + normalized.slice(2);
  }
  
  return normalized;
};

const AuthController = {
  async login(req, res) {
    try {
      console.log('📝 Tentativa de login:', {
        phone: req.body.phone,
        userType: req.body.userType,
        timestamp: new Date().toISOString()
      });
      
      // Usar a função de normalização
      const phone = normalizePhone(req.body.phone);
      const { userType } = req.body;
      
      // Buscar usuário APENAS com o telefone e userType específicos
      const user = await User.findOne({ phone, userType });
      console.log('🔍 Busca de usuário:', {
        encontrado: !!user,
        phone,
        phoneOriginal: req.body.phone,
        userType,
        userId: user?._id
      });
      
      if (!user) {
        // Verificar se existe usuário com o mesmo telefone mas userType diferente
        const userWithDifferentType = await User.findOne({ phone });
        if (userWithDifferentType) {
          const existingType = userWithDifferentType.userType === 'driver' ? 'motorista' : 'passageiro';
          const requestedType = userType === 'driver' ? 'motorista' : 'passageiro';
          
          console.log('❌ Login falhou: Telefone cadastrado como tipo diferente', {
            phone,
            existingType: userWithDifferentType.userType,
            requestedType: userType,
            timestamp: new Date().toISOString()
          });
          
          return res.status(401).json({ 
            error: `Este telefone está cadastrado como ${existingType}. Para acessar como ${requestedType}, use um telefone diferente.`
          });
        }
        
        console.log('❌ Login falhou: Usuário não encontrado', {
          phone,
          phoneOriginal: req.body.phone,
          userType,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(req.body.password, user.password);
      if (!isValidPassword) {
        console.log('❌ Login falhou: Senha inválida', {
          userId: user._id,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ error: 'Senha inválida' });
      }

      const token = jwt.sign(
        { id: user._id, userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Login bem-sucedido:', {
        userId: user._id,
        userType: user.userType,
        timestamp: new Date().toISOString()
      });

      // Não retornar a senha
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({ token, user: userResponse });
    } catch (error) {
      console.error('❌ Erro no login:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({ 
        error: 'Erro ao fazer login', 
        details: error.message 
      });
    }
  },

  async register(req, res) {
    try {
      // Normalizar o telefone antes de salvar
      const normalizedData = {
        ...req.body,
        phone: normalizePhone(req.body.phone)
      };

      console.log('📝 Tentativa de registro:', {
        phone: normalizedData.phone,
        phoneOriginal: req.body.phone,
        email: normalizedData.email,
        userType: normalizedData.userType,
        name: normalizedData.name,
        timestamp: new Date().toISOString()
      });

      // Verificar se usuário já existe com o telefone normalizado
      const existingUserByPhone = await User.findOne({ phone: normalizedData.phone });
      const existingUserByEmail = await User.findOne({ email: normalizedData.email });

      if (existingUserByPhone) {
        console.log('❌ Registro falhou: Telefone já cadastrado', {
          phone: normalizedData.phone,
          existingUserType: existingUserByPhone.userType,
          newUserType: normalizedData.userType,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ 
          error: `Este telefone já está cadastrado como ${existingUserByPhone.userType === 'driver' ? 'motorista' : 'passageiro'}. Um telefone não pode ser usado para ambos os tipos de usuário.`
        });
      }

      if (existingUserByEmail) {
        console.log('❌ Registro falhou: Email já cadastrado', {
          email: normalizedData.email,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ 
          error: 'Email já cadastrado'
        });
      }

      // Criar novo usuário com o telefone normalizado
      const user = await User.create(normalizedData);
      console.log('✅ Usuário criado:', {
        userId: user._id,
        userType: user.userType,
        timestamp: new Date().toISOString()
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
        id: savedUser?._id,
        timestamp: new Date().toISOString()
      });

      // Não retornar a senha
      const userResponse = user.toObject();
      delete userResponse.password;

      console.log('✅ Registro completo com sucesso');
      return res.status(201).json({ token, user: userResponse });
    } catch (error) {
      console.error('❌ Erro no registro:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        validationErrors: error.errors,
        timestamp: new Date().toISOString()
      });
      
      // Tratamento específico para erros de validação do Mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          error: 'Erro de validação', 
          details: validationErrors 
        });
      }

      return res.status(500).json({ 
        error: 'Erro ao criar usuário', 
        details: error.message 
      });
    }
  }
};

module.exports = AuthController;