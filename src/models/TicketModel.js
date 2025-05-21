const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  seats: { type: [Number], required: true },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
});

module.exports = mongoose.model('Ticket', ticketSchema);