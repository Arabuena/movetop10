const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  cpf: {
    type: String,
    sparse: true
  },
  userType: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['offline', 'online', 'busy'],
    default: 'offline'
  },
  // Campos específicos para motoristas
  cnh: {
    type: String,
    sparse: true
  },
  vehicle: {
    model: String,
    plate: String,
    year: Number,
    color: String
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema); 