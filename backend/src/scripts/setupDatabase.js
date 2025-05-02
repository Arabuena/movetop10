const mongoose = require('mongoose');

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...');

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas');

    // Criar coleções necessárias
    const db = mongoose.connection.db;
    
    // Lista de coleções que queremos criar
    const collections = ['users', 'rides', 'messages'];
    
    // Verificar e criar coleções
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(col => col.name);

    for (const collection of collections) {
      if (!existingCollectionNames.includes(collection)) {
        await db.createCollection(collection);
        console.log(`✨ Coleção '${collection}' criada com sucesso`);
      } else {
        console.log(`ℹ️ Coleção '${collection}' já existe`);
      }
    }

    // Criar índices necessários
    const Users = mongoose.connection.collection('users');
    await Users.createIndex({ phone: 1, userType: 1 }, { unique: true });
    console.log('📑 Índices criados com sucesso');

    console.log('✅ Configuração do banco de dados concluída!');
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração do banco de dados:', error);
    throw error;
  }
}

module.exports = setupDatabase; 