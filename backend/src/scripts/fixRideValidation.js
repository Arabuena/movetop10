require('dotenv').config();
const mongoose = require('mongoose');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Função para criar uma corrida de teste válida
async function createTestRide() {
  try {
    // Buscar um passageiro e um motorista existentes
    
    const passenger = await User.findOne({ userType: 'passenger' });
    const driver = await User.findOne({ userType: 'driver', status: 'online' });
    
    if (!passenger) {
      console.error('Nenhum passageiro encontrado no banco de dados');
      process.exit(1);
    }
    
    console.log('Passageiro encontrado:', passenger._id);
    console.log('Motorista encontrado:', driver ? driver._id : 'Nenhum motorista online');
    
    // Dados da corrida
    const rideData = {
      passenger: passenger._id,
      origin: {
        lat: -23.550520,
        lng: -46.633308,
        address: 'Avenida Paulista, 1000, São Paulo'
      },
      destination: {
        lat: -23.557821,
        lng: -46.639581,
        address: 'Rua Augusta, 500, São Paulo'
      },
      price: 25.50,
      distance: 3500,  // 3.5 km em metros
      duration: 900,   // 15 minutos em segundos
      paymentMethod: 'cash',
      status: 'pending'
    };
    
    // Se houver um motorista online, associá-lo à corrida
    if (driver) {
      rideData.driver = driver._id;
    }
    
    // Criar a corrida
    const ride = await Ride.create(rideData);
    console.log('Corrida de teste criada com sucesso:', ride);
    
    // Verificar se a corrida foi criada corretamente
    const savedRide = await Ride.findById(ride._id).populate('passenger').populate('driver');
    console.log('Corrida salva no banco de dados:', savedRide);
    
    return ride;
  } catch (error) {
    console.error('Erro ao criar corrida de teste:', error);
    throw error;
  }
}

// Executar a função
createTestRide()
  .then(() => {
    console.log('Script executado com sucesso');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro ao executar script:', err);
    process.exit(1);
  });