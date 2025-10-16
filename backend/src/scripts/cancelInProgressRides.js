require('dotenv').config();
const { connectDB } = require('../config/database');
const Ride = require('../models/Ride');

async function cancelInProgressRides() {
  try {
    await connectDB();

    const activeStatuses = ['pending', 'accepted', 'collecting', 'in_progress'];
    const inProgress = await Ride.find({ status: { $in: activeStatuses } }).sort('-updatedAt');
    if (!inProgress.length) {
      console.log('Nenhuma corrida em andamento encontrada. Nada a cancelar.');
      process.exit(0);
    }

    console.log(`Encontradas ${inProgress.length} corridas em andamento:`);
    inProgress.forEach(r => {
      const id = r._id.toString();
      const when = r.updatedAt || r.createdAt;
      const price = r.price || 0;
      console.log(` - ${id} | ${new Date(when).toISOString()} | R$ ${price.toFixed(2)}`);
    });

    const result = await Ride.updateMany(
      { status: { $in: activeStatuses } },
      { $set: { status: 'cancelled' } }
    );

    console.log(`Canceladas ${result.modifiedCount || result.nModified || 0} corridas ativas (accepted/collecting/in_progress).`);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao cancelar corridas em andamento:', err);
    process.exit(1);
  }
}

cancelInProgressRides();