const mongoose = require('mongoose');


// Remover opções deprecadas
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Setup inicial do banco
    await setupCollections(conn.connection.db);
    
    return conn;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    throw error;
  }
};

async function setupCollections(db) {
  try {
    // Criar coleções se não existirem
    const collections = ['users', 'rides', 'messages'];
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);

    for (const colName of collections) {
      if (!existingNames.includes(colName)) {
        await db.createCollection(colName);
        console.log(`✨ Coleção '${colName}' criada`);
      }
    }

    // Setup dos índices
    const users = db.collection('users');
    
    // Remover índices existentes
    try {
      await users.dropIndexes();
      console.log('🗑️ Índices antigos removidos');
    } catch (error) {
      console.log('Nenhum índice antigo para remover');
    }

    // Criar novos índices com nomes específicos
    await users.createIndexes([
      {
        key: { phone: 1, userType: 1 },
        unique: true,
        name: 'phone_userType_unique'
      },
      {
        key: { email: 1 },
        unique: true,
        sparse: true,
        name: 'email_unique_sparse'
      }
    ]);

    const rides = db.collection('rides');
    try {
      await rides.dropIndexes();
    } catch (error) {
      console.log('Nenhum índice antigo para remover em rides');
    }

    await rides.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'status_createdAt_compound' }
    );

    console.log('✅ Novos índices configurados com sucesso');
  } catch (error) {
    console.error('❌ Erro no setup das coleções:', error);
    throw error;
  }
}

module.exports = { connectDB }; 