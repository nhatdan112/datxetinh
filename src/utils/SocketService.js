const { Server } = require('socket.io');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Update with frontend URL (e.g., http://localhost:3000)
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Notify clients of booking updates
  notifyBookingUpdate(booking) {
    this.io.emit('bookingUpdate', {
      bookingId: booking._id,
      tripId: booking.tripId,
      userId: booking.userId,
      seats: booking.seats,
      status: booking.status,
      timestamp: new Date(),
    });
  }

  // Notify specific user
  notifyUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }
}

module.exports = SocketService;