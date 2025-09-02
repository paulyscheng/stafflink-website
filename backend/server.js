const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./src/utils/logger');
const db = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const companyRoutes = require('./src/routes/companies');
const workerRoutes = require('./src/routes/workers');
const projectRoutes = require('./src/routes/projects');
const invitationRoutes = require('./src/routes/invitations');
const skillRoutes = require('./src/routes/skills');
const notificationRoutes = require('./src/routes/notifications');
const debugRoutes = require('./src/routes/debug');

const app = express();
const server = createServer(app);

// Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:19006",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:19006",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/jobs', require('./src/routes/jobRoutes'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join user to their room
  socket.on('join', (data) => {
    const { userId, userType } = data;
    socket.join(`${userType}_${userId}`);
    logger.info(`User ${userId} (${userType}) joined room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
db.testConnection()
  .then((connected) => {
    if (!connected) {
      logger.warn('⚠️  Running without database - some features will not work');
    }
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`💊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📱 Access URL: http://localhost:${PORT}/api`);
      if (!connected) {
        logger.warn('⚠️  Database is not connected - API endpoints requiring database will fail');
      }
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;