const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  origin: {
    lat: Number,
    lng: Number,
    address: String
  },
  destination: {
    lat: Number,
    lng: Number,
    address: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'collecting', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // em metros
    required: true
  },
  duration: {
    type: Number, // em segundos
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card'],
    required: true,
    default: 'cash'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  rating: {
    passenger: Number,
    driver: Number
  }
}, {
  timestamps: true
});

const rideStatuses = {
  PENDING: 'pending',      // Corrida solicitada, aguardando motorista
  ACCEPTED: 'accepted',    // Motorista aceitou, a caminho do passageiro
  COLLECTING: 'collecting', // Motorista chegou ao local de coleta
  IN_PROGRESS: 'in_progress', // Passageiro coletado, corrida em andamento
  COMPLETED: 'completed',  // Corrida finalizada com sucesso
  CANCELLED: 'cancelled'   // Corrida cancelada
};

module.exports = mongoose.model('Ride', rideSchema); 