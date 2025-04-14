const mongoose = require('mongoose');

// Configurar logs do Mongoose
mongoose.set('debug', true);

// Conectar ao MongoDB com logs detalhados
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔌 Host:', mongoose.connection.host);
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', {
      error: error.message,
      stack: error.stack,
      uri: process.env.MONGODB_URI.replace(
        /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
        '$1**********:**********@'
      )
    });
  });

// Monitorar eventos de conexão
mongoose.connection.on('error', (error) => {
  console.error('❌ Erro na conexão MongoDB:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Desconectado do MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Reconectado ao MongoDB');
}); 