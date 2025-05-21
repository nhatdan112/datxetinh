const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Station', stationSchema);