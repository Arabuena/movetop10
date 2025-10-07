require('./backend/node_modules/dotenv').config();
const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/src/models/User');
const jwt = require('./backend/node_modules/jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Conectado ao MongoDB');
  
  const users = await User.find({}, 'name phone userType isOnline isAvailable isApproved').limit(5);
  console.log('Usuários encontrados:');
  users.forEach(user => {
    console.log(`- ID: ${user._id}, Nome: ${user.name}, Tipo: ${user.userType}, Online: ${user.isOnline}`);
    
    // Gerar token JWT para teste
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log(`  Token: ${token}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});