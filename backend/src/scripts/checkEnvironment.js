function checkEnvironment() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente necessárias não encontradas:', missing);
    throw new Error('Configuração de ambiente incompleta');
  }

  // Validar formato da URI do MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri.includes('mongodb+srv://')) {
    throw new Error('MONGODB_URI inválida: deve ser uma string de conexão do MongoDB Atlas');
  }

  console.log('✅ Variáveis de ambiente verificadas com sucesso');
  return true;
}

module.exports = checkEnvironment; 