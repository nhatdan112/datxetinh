const TicketModel = require('../models/TicketModel');
const SocketService = require('../utils/SocketService');
const axios = require('axios');
const BookingService = require('../services/BookingService');

// Environment variable for FastAPI JWT token
const FASTAPI_JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token'; // Fallback for testing

const BookingController = {
  async bookTicket(req, res) {
    try {
      const { userId, tripId, seats } = req.body;

      // Validate input
      if (!userId || !tripId || !seats || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid input' });
      }

      // Use BookingService to create the booking
      const booking = await BookingService.createBooking(userId, tripId, seats);

      // Notify via SocketService
      SocketService.notifyBookingUpdate(booking);
      SocketService.notifyUser(userId, 'bookingConfirmed', {
        bookingId: booking._id,
        tripId,
        seats,
      });

      return res.status(201).json(booking);
    } catch (error) {
      console.error('Booking error:', error.message);
      return res.status(500).json({ error: `Booking failed: ${error.message}` });
    }
  },

  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await TicketModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking already cancelled' });
      }
      
      // Update booking status
      booking.status = 'cancelled';
      booking.updatedAt = new Date();
      await booking.save();

      // Restore seats in FastAPI
      try {
        const tripResponse = await axios.get(`http://localhost:8000/api/trips/${booking.tripId}`, {
          headers: { Authorization: `Bearer ${FASTAPI_JWT_TOKEN}` },
        });
        const trip = tripResponse.data;
        await axios.patch(
          `http://localhost:8000/api/trips/${booking.tripId}`,
          { available_seats: trip.available_seats + booking.seats.length },
          { headers: { Authorization: `Bearer ${FASTAPI_JWT_TOKEN}` } }
        );
      } catch (apiError) {
        console.error('FastAPI error during cancellation:', apiError.message);
        // Log but don't fail the request, as booking is already cancelled
      }

      // Notify via SocketService
      SocketService.notifyBookingUpdate(booking);
      SocketService.notifyUser(booking.userId, 'bookingCancelled', {
        bookingId,
        tripId: booking.tripId,
      });

      return res.status(200).json(booking);
    } catch (error) {
      console.error('Cancellation error:', error.message);
      return res.status(500).json({ error: `Cancellation failed: ${error.message}` });
    }
  },

  async getUserBookings(req, res) {
    try {
      const { userId } = req.params;

      const bookings = await TicketModel.find({ userId }).populate({
        path: 'tripId',
        populate: [
          { path: 'sourceStationId', select: 'name' },
          { path: 'destinationStationId', select: 'name' },
        ],
      });

      return res.status(200).json(bookings);
    } catch (error) {
      console.error('Fetch bookings error:', error.message);
      return res.status(500).json({ error: `Failed to fetch bookings: ${error.message}` });
    }
  },
};

module.exports = BookingController;