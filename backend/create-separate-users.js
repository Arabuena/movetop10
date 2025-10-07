const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createSeparateUsers() {
  try {
    console.log('🚀 Criando usuários separados para driver e passenger...');
    
    // Conectar ao MongoDB
    const mongoUri = 'mongodb+srv://ara100limite:ERxkG9nXZjbwvpMk@cluster0.yzf2r.mongodb.net/move?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');
    
    // Importar o modelo de usuário
    const User = require('./src/models/User');
    
    // Criar senha hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // 1. Criar usuário PASSAGEIRO separado
    const existingPassenger = await User.findOne({ phone: '62000000000', userType: 'passenger' });
    if (!existingPassenger) {
      const passenger = new User({
        name: 'Sarah Passageira',
        phone: '62000000000',
        email: 'sarah.passageira@teste.com',
        cpf: '12345678901',
        userType: 'passenger',
        password: hashedPassword,
        status: 'offline'
      });
      
      await passenger.save();
      console.log('✅ Usuário PASSAGEIRO criado:');
      console.log(`   📱 Telefone: 62000000000`);
      console.log(`   👤 Nome: Sarah Passageira`);
      console.log(`   📧 Email: sarah.passageira@teste.com`);
      console.log(`   🔑 Senha: 123456`);
      console.log(`   🆔 ID: ${passenger._id}`);
    } else {
      console.log('ℹ️ Usuário PASSAGEIRO já existe:');
      console.log(`   📱 Telefone: 62000000000`);
      console.log(`   👤 Nome: ${existingPassenger.name}`);
      console.log(`   🆔 ID: ${existingPassenger._id}`);
    }
    
    // 2. Criar usuário MOTORISTA separado
    const existingDriver = await User.findOne({ phone: '11999996666', userType: 'driver' });
    if (!existingDriver) {
      const driver = new User({
        name: 'João Motorista',
        phone: '11999996666',
        email: 'joao.motorista@teste.com',
        cpf: '98765432100',
        cnh: '12345678900',
        userType: 'driver',
        password: hashedPassword,
        status: 'offline',
        isApproved: true,
        isOnline: false,
        isAvailable: false,
        vehicle: {
          model: 'Honda Civic',
          plate: 'ABC-1234',
          year: 2020,
          color: 'Branco'
        }
      });
      
      await driver.save();
      console.log('✅ Usuário MOTORISTA criado:');
      console.log(`   📱 Telefone: 11999996666`);
      console.log(`   👤 Nome: João Motorista`);
      console.log(`   📧 Email: joao.motorista@teste.com`);
      console.log(`   🔑 Senha: 123456`);
      console.log(`   🆔 ID: ${driver._id}`);
    } else {
      console.log('ℹ️ Usuário MOTORISTA já existe:');
      console.log(`   📱 Telefone: 11999996666`);
      console.log(`   👤 Nome: ${existingDriver.name}`);
      console.log(`   🆔 ID: ${existingDriver._id}`);
    }
    
    // 3. Verificar se existe usuário duplicado (mesmo telefone para ambos os tipos)
    const duplicateUsers = await User.aggregate([
      {
        $group: {
          _id: "$phone",
          count: { $sum: 1 },
          users: { $push: { id: "$_id", userType: "$userType", name: "$name" } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    if (duplicateUsers.length > 0) {
      console.log('⚠️ Usuários duplicados encontrados (mesmo telefone):');
      duplicateUsers.forEach(duplicate => {
        console.log(`   📱 Telefone: ${duplicate._id}`);
        duplicate.users.forEach(user => {
          console.log(`     - ${user.userType}: ${user.name} (ID: ${user.id})`);
        });
      });
    } else {
      console.log('✅ Nenhum usuário duplicado encontrado');
    }
    
    console.log('\n🎯 RESUMO DOS USUÁRIOS:');
    console.log('==========================================');
    console.log('PASSAGEIRO:');
    console.log('  📱 Telefone: 62000000000');
    console.log('  🔑 Senha: 123456');
    console.log('  🌐 URL: http://localhost:3000/passenger');
    console.log('');
    console.log('MOTORISTA:');
    console.log('  📱 Telefone: 11999996666');
    console.log('  🔑 Senha: 123456');
    console.log('  🌐 URL: http://localhost:3000/driver');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Conexão com MongoDB encerrada');
  }
}

createSeparateUsers();