require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, 'name phone userType isOnline').limit(20).lean();
    console.log('Usuários (nome, telefone, tipo, online):');
    users.forEach(u => {
      console.log(`- ${u.name || '(sem nome)'} | ${u.phone} | ${u.userType} | ${u.isOnline ? 'online' : 'offline'}`);
    });
  } catch (err) {
    console.error('Erro ao listar usuários:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();