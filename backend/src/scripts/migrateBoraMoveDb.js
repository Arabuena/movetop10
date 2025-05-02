const mongoose = require('mongoose');
require('dotenv').config();

async function migrateDatabase() {
  try {
    // Conectar ao banco 'bora'
    const boraCon = await mongoose.createConnection(
      process.env.MONGODB_URI.replace('/move?', '/bora?')
    );
    
    // Conectar ao banco 'move'
    const moveCon = await mongoose.createConnection(process.env.MONGODB_URI);
    
    // Migrar usuários
    const users = await boraCon.db.collection('users').find({}).toArray();
    if (users.length > 0) {
      await moveCon.db.collection('users').insertMany(users, { ordered: false });
    }
    
    // Migrar outras coleções necessárias
    const collections = ['rides', 'messages'];
    for (const col of collections) {
      const docs = await boraCon.db.collection(col).find({}).toArray();
      if (docs.length > 0) {
        await moveCon.db.collection(col).insertMany(docs, { ordered: false });
      }
    }
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    process.exit();
  }
}

migrateDatabase(); 