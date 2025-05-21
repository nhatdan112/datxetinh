const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  startStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  endStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  departureTime: { type: Date, required: true },
  price: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Trip', tripSchema);