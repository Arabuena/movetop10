require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Função para redefinir a senha do motorista
async function resetDriverPassword() {
  try {
    console.log('🚀 Iniciando redefinição de senha do motorista...');
    
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
    
    // Redefinir a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // Atualizar a senha e garantir que o status está online
    driver.password = hashedPassword;
    driver.status = 'online';
    
    await driver.save();
    
    console.log('✅ Senha do motorista redefinida com sucesso!');
    console.log('📱 Telefone: 11999996666');
    console.log('🔑 Nova senha: 123456');
    console.log('📍 Status: online (ativo)');
    
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
resetDriverPassword();