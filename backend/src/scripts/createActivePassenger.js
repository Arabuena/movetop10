const mongoose = require('mongoose');
const User = require('../models/User');

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/movetop10', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

const createActivePassenger = async () => {
  console.log('🚀 Iniciando criação de passageiro ativo...');
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Verificar se o passageiro já existe
    const existingPassenger = await User.findOne({ 
      phone: '11999999999',
      userType: 'passenger'
    });
    
    if (!existingPassenger) {
      // Criar novo passageiro
      const passenger = new User({
        name: 'Passageiro Teste',
        phone: '11999999999',
        email: 'passageiro@teste.com',
        userType: 'passenger',
        password: '123456',
        status: 'offline'
      });
      
      await passenger.save();
      
      console.log('✅ Passageiro criado com sucesso!');
      console.log('📱 Telefone: 11999999999');
      console.log('🔑 Senha: 123456');
      console.log('📍 Status: offline');
    } else {
      console.log('ℹ️ Passageiro já existe');
      console.log('📱 Telefone: 11999999999');
      console.log('🔑 Senha: 123456');
      console.log('📍 Status:', existingPassenger.status);
    }
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao criar passageiro ativo:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

// Executar a função
createActivePassenger();