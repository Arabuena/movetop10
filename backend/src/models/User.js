const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true
  },
  userType: {
    type: String,
    enum: ['driver', 'passenger'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  // Campos específicos para motorista
  cnh: {
    type: String,
    required: function() { return this.userType === 'driver'; }
  },
  vehicle: {
    model: String,
    plate: String,
    year: Number,
    color: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 