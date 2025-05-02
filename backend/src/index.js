const mongoose = require('mongoose');
const setupDatabase = require('./scripts/setupDatabase');

// Configurar logs do Mongoose
mongoose.set('debug', true);

// Função para iniciar o servidor
async function startServer() {
  try {
    // Tentar configurar o banco de dados
    await setupDatabase();
    
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

    // Iniciar o servidor Express aqui
    const app = require('./app');
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer(); 