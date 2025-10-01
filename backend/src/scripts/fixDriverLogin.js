require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Função para verificar e corrigir o login do motorista
async function fixDriverLogin() {
  try {
    console.log('🚀 Iniciando verificação e correção do login do motorista...');
    
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
    console.log(`Status: ${driver.status}`);
    
    // Verificar se o telefone está no formato correto (apenas números)
    const originalPhone = driver.phone;
    const normalizedPhone = driver.phone.replace(/\D/g, '');
    
    if (originalPhone !== normalizedPhone) {
      console.log(`⚠️ Telefone em formato incorreto: ${originalPhone}`);
      driver.phone = normalizedPhone;
      console.log(`✅ Telefone normalizado: ${normalizedPhone}`);
    }
    
    // Redefinir a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    driver.password = hashedPassword;
    
    // Garantir que o status está online
    driver.status = 'online';
    
    // Salvar as alterações
    await driver.save();
    
    console.log('✅ Motorista atualizado com sucesso!');
    console.log('📱 Telefone: ' + driver.phone);
    console.log('🔑 Senha: 123456');
    console.log('📍 Status: ' + driver.status);
    
    // Verificar se é possível fazer login com as credenciais
    console.log('🔍 Simulando login com as credenciais atualizadas...');
    
    // Buscar o motorista com as credenciais atualizadas
    const foundDriver = await User.findOne({ 
      phone: driver.phone,
      userType: 'driver'
    });
    
    if (!foundDriver) {
      console.log('❌ Falha na simulação de login: Motorista não encontrado com o telefone fornecido');
      return;
    }
    
    // Verificar a senha
    const isValidPassword = await bcrypt.compare('123456', foundDriver.password);
    if (!isValidPassword) {
      console.log('❌ Falha na simulação de login: Senha inválida');
      return;
    }
    
    console.log('✅ Simulação de login bem-sucedida!');
    console.log('✅ Credenciais para login:');
    console.log('📱 Telefone: ' + driver.phone);
    console.log('🔑 Senha: 123456');
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir login do motorista:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

// Executar a função
fixDriverLogin();