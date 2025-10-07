const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function updateDriverStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Atualizar o motorista de teste
    const driver = await User.findOneAndUpdate(
      { phone: '11999996666', userType: 'driver' },
      { 
        $set: { 
          isApproved: true,
          isOnline: false,
          isAvailable: false,
          status: 'offline'
        } 
      },
      { new: true }
    );

    if (driver) {
      console.log('✅ Motorista atualizado:', {
        id: driver._id,
        phone: driver.phone,
        isApproved: driver.isApproved,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        status: driver.status
      });
    } else {
      console.log('❌ Motorista não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

updateDriverStatus();