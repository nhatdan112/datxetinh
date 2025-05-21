  const BookingService = require('../services/BookingService');
  const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

  class BookingController {
    async bookTicket(req, res, next) {
      try {
        const { userId, tripId, seats } = req.body;
        const ticket = await BookingService.bookTicket(userId, tripId, seats);
        res.status(201).json(ticket);
      } catch (error) {
        next(error);
      }
    }

    async getTicketById(req, res, next) {
      try {
        const ticket = await BookingService.getTicketById(req.params.id);
        if (!ticket) throw new Error('Ticket not found');
        res.json(ticket);
      } catch (error) {
        next(error);
      }
    }

    async getUserTickets(req, res, next) {
      try {
        const tickets = await BookingService.getUserTickets(req.params.userId);
        res.json(tickets);
      } catch (error) {
        next(error);
      }
    }
    
    async getUserBookings(req, res) {
      try {
        const { userId } = req.params;
        const bookings = await BookingService.getUserBookings(userId);
        res.status(200).json(bookings);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  


    async cancelTicket(req, res, next) {
      try {
        await BookingService.cancelTicket(req.params.id);
        res.json({ message: 'Ticket cancelled successfully' });
      } catch (error) {
        next(error);
      }
    }
  }

  module.exports = new BookingController();