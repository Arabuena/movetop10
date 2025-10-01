require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Função para forçar a redefinição da senha do motorista
async function forceDriverPassword() {
  try {
    console.log('🚀 Iniciando redefinição forçada da senha do motorista...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Importar o modelo de usuário
    const User = require('../models/User');
    
    // Buscar o motorista pelo email
    const driver = await User.findOne({ email: 'motorista.ativo@teste.com' });
    
    if (!driver) {
      console.log('❌ Motorista não encontrado!');
      return;
    }
    
    console.log('📋 Informações do motorista:');
    console.log(`Nome: ${driver.name}`);
    console.log(`Email: ${driver.email}`);
    console.log(`Telefone: ${driver.phone}`);
    console.log(`Tipo: ${driver.userType}`);
    
    // Gerar uma nova senha hash diretamente
    const plainPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Atualizar diretamente no banco de dados para evitar hooks/middleware
    const result = await User.updateOne(
      { _id: driver._id },
      { 
        $set: { 
          password: hashedPassword,
          status: 'online'
        } 
      }
    );
    
    console.log('✅ Resultado da atualização:', result);
    
    // Verificar se a atualização foi bem-sucedida
    if (result.modifiedCount === 1) {
      console.log('✅ Senha do motorista redefinida com sucesso!');
      console.log('📱 Telefone: ' + driver.phone);
      console.log('🔑 Nova senha: ' + plainPassword);
      console.log('📍 Status: online');
    } else {
      console.log('❌ Falha ao atualizar a senha do motorista');
    }
    
    // Buscar o motorista atualizado
    const updatedDriver = await User.findById(driver._id);
    console.log('📋 Motorista após atualização:');
    console.log(`Status: ${updatedDriver.status}`);
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao redefinir senha do motorista:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

// Executar a função
forceDriverPassword();