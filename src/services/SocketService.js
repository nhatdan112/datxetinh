const { Server } = require('socket.io');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Update with frontend URL
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

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

  notifyUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }
}

module.exports = SocketService;