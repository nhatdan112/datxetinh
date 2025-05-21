const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AuthMiddleware = require('../middlewares/AuthMiddleware'); // Relative path
const AppConfig = require('../config/AppConfig');
const BookingController = require('../controllers/BookingController'); 
router.post('/', AuthMiddleware, BookingController.bookTicket);
router.get('/user/:userId', AuthMiddleware, BookingController.getUserBookings);
router.delete('/:id', AuthMiddleware, BookingController.cancelTicket);

async function getDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  await mongoose.connect('mongodb://localhost:27017/bus_ticketing', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return mongoose.connection.db;
}

router.post('/', AuthMiddleware, async (req, res) => {
  const { userId, tripId, seats } = req.body;

  if (!userId || !tripId || !seats || !Array.isArray(seats)) {
    return res.status(400).json({ message: 'Missing or invalid fields' });
  }

  try {
    const db = await getDb();
    const busesCollection = db.collection('buses');
    const bookingsCollection = db.collection('bookings');

    const trip = await busesCollection.findOne({ id: tripId });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.availableSeats < seats.length) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    const booking = {
      userId,
      tripId,
      seats,
      bookingDate: new Date(),
      status: 'confirmed',
    };

    const result = await bookingsCollection.insertOne(booking);

    await busesCollection.updateOne(
      { id: tripId },
      { $inc: { availableSeats: -seats.length } }
    );

    res.status(201).json({ message: 'Booking created', bookingId: result.insertedId });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/:userId', AuthMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const db = await getDb();
    const bookingsCollection = db.collection('bookings');
    const busesCollection = db.collection('buses');

    const bookings = await bookingsCollection.find({ userId }).toArray();
    const bookingsWithTripDetails = await Promise.all(
      bookings.map(async (booking) => {
        const trip = await busesCollection.findOne({ id: booking.tripId });
        return {
          ...booking,
          tripDetails: trip || { message: 'Trip not found' },
        };
      })
    );

    res.json(bookingsWithTripDetails);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:bookingId', AuthMiddleware, async (req, res) => {
  const { bookingId } = req.params;

  try {
    const db = await getDb();
    const bookingsCollection = db.collection('bookings');
    const busesCollection = db.collection('buses');

    // Find the booking by ID
    const booking = await bookingsCollection.findOne({ _id: new mongoose.Types.ObjectId(bookingId) });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Delete the booking
    await bookingsCollection.deleteOne({ _id: new mongoose.Types.ObjectId(bookingId) });

    // Restore seats in the buses collection
    await busesCollection.updateOne(
      { id: booking.tripId },
      { $inc: { availableSeats: booking.seats.length } }
    );

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router