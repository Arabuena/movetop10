const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const rideSchema = new Schema({
  passenger: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  origin: {
    type: pointSchema,
    required: true
  },
  destination: {
    type: pointSchema,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'CASH'],
    default: 'CREDIT_CARD'
  },
  startTime: Date,
  endTime: Date,
  cancelReason: String,
  cancelledBy: {
    type: String,
    enum: ['PASSENGER', 'DRIVER', 'SYSTEM']
  },
  rating: {
    passenger: {
      type: Number,
      min: 1,
      max: 5
    },
    driver: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// Índices
rideSchema.index({ "origin.coordinates": "2dsphere" });
rideSchema.index({ "destination.coordinates": "2dsphere" });
rideSchema.index({ status: 1, passenger: 1 });
rideSchema.index({ status: 1, driver: 1 });

module.exports = mongoose.model('Ride', rideSchema); 