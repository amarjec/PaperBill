// server.js
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 8000;

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.io for real-time features (OTP push & Device Kick-out)
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your app's domain
    methods: ['GET', 'POST']
  }
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // When an Owner logs in, they should join a "room" using their User ID
  socket.on('join_owner_room', (ownerId) => {
    socket.join(ownerId);
    console.log(`Owner ${ownerId} joined their secure room.`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Attach Socket.io to the global `app` object so you can use it inside your controllers
// Example inside auth.controller.js: req.app.get('io').to(ownerId).emit('staff_otp', { otp: 1234 });
app.set('io', io);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});