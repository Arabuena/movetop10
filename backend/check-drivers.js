const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/movetop10', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Conectado ao MongoDB');
  
  // Buscar todos os motoristas
  const drivers = await User.find({ userType: 'driver' });
  console.log('\n=== TODOS OS MOTORISTAS ===');
  drivers.forEach(driver => {
    console.log(`ID: ${driver._id}`);
    console.log(`Telefone: ${driver.phone}`);
    console.log(`isOnline: ${driver.isOnline}`);
    console.log(`isAvailable: ${driver.isAvailable}`);
    console.log(`isApproved: ${driver.isApproved}`);
    console.log(`Status: ${driver.status}`);
    console.log(`Localização: ${driver.location ? JSON.stringify(driver.location) : 'Não definida'}`);
    console.log('---');
  });
  
  // Buscar motoristas disponíveis (critério usado na busca)
  const availableDrivers = await User.find({
    userType: 'driver',
    isOnline: true,
    isAvailable: true,
    isApproved: true,
    location: { $exists: true }
  });
  
  console.log(`\n=== MOTORISTAS DISPONÍVEIS PARA CORRIDAS ===`);
  console.log(`Total encontrado: ${availableDrivers.length}`);
  availableDrivers.forEach(driver => {
    console.log(`- ${driver.phone} (ID: ${driver._id})`);
  });
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});