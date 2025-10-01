require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Função para criar motorista ativo
async function createActiveDriver() {
  try {
    console.log('🚀 Iniciando criação de motorista ativo...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Importar o modelo de usuário
    const User = require('../models/User');
    
    // Verificar se o motorista já existe
    const existingDriver = await User.findOne({ email: 'motorista.ativo@teste.com' });
    
    // Criar motorista ativo se não existir
    if (!existingDriver) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      const driver = new User({
        name: 'Motorista Ativo',
        phone: '11999996666',
        email: 'motorista.ativo@teste.com',
        cpf: '11122233344',
        userType: 'driver',
        cnh: '98765432100',
        vehicle: {
          model: 'Honda Civic',
          plate: 'XYZ5678',
          year: 2022,
          color: 'Preto'
        },
        isApproved: true,
        status: 'online', // Definindo o status como online (ativo)
        location: {
          type: 'Point',
          coordinates: [-49.2648, -16.6869] // Coordenadas de Goiânia
        },
        password: hashedPassword
      });
      
      await driver.save();
      console.log('✅ Motorista ativo criado com sucesso!');
      console.log('📱 Telefone: 11999996666');
      console.log('🔑 Senha: 123456');
      console.log('📍 Status: online (ativo)');
    } else {
      // Atualizar para status online se já existir
      existingDriver.status = 'online';
      existingDriver.location = {
        type: 'Point',
        coordinates: [-49.2648, -16.6869] // Coordenadas de Goiânia
      };
      await existingDriver.save();
      
      console.log('ℹ️ Motorista já existe - status atualizado para online (ativo)');
      console.log('📱 Telefone: 11999996666');
      console.log('🔑 Senha: 123456');
      console.log('📍 Status: online (ativo)');
    }
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao criar motorista ativo:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

// Executar a função
createActiveDriver();