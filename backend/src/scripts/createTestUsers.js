require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar ao MongoDB
async function createTestUsers() {
  try {
    console.log('🚀 Iniciando criação de usuários de teste...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Importar o modelo de usuário
    const User = require('../models/User');
    
    // Verificar se os usuários de teste já existem
    const existingPassenger = await User.findOne({ email: 'passageiro@teste.com' });
    const existingDriver = await User.findOne({ email: 'motorista@teste.com' });
    
    // Criar usuário passageiro se não existir
    if (!existingPassenger) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      const passenger = new User({
        name: 'Passageiro Teste',
        phone: '11999998888',
        email: 'passageiro@teste.com',
        cpf: '12345678900',
        userType: 'passenger',
        password: hashedPassword
      });
      
      await passenger.save();
      console.log('✅ Usuário passageiro de teste criado com sucesso!');
      console.log('📱 Telefone: 11999998888');
      console.log('🔑 Senha: 123456');
    } else {
      console.log('ℹ️ Usuário passageiro de teste já existe');
      console.log('📱 Telefone: 11999998888');
      console.log('🔑 Senha: 123456');
    }
    
    // Criar usuário motorista se não existir
    if (!existingDriver) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      const driver = new User({
        name: 'Motorista Teste',
        phone: '11999997777',
        email: 'motorista@teste.com',
        cpf: '98765432100',
        userType: 'driver',
        cnh: '12345678900',
        vehicle: {
          model: 'Fiat Uno',
          plate: 'ABC1234',
          year: 2020,
          color: 'Branco'
        },
        isApproved: true,
        password: hashedPassword
      });
      
      await driver.save();
      console.log('✅ Usuário motorista de teste criado com sucesso!');
      console.log('📱 Telefone: 11999997777');
      console.log('🔑 Senha: 123456');
    } else {
      console.log('ℹ️ Usuário motorista de teste já existe');
      console.log('📱 Telefone: 11999997777');
      console.log('🔑 Senha: 123456');
    }
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

// Executar a função
createTestUsers();