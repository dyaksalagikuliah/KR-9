require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

// Import configurations
const { pool } = require('./config/database');
const { redis } = require('./config/redis');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const userRoutes = require('./routes/userRoutes');
const contractRoutes = require('./routes/contractRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Socket(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');

    // Check Redis
    await redis.ping();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/bounties`, bountyRoutes);
app.use(`/api/${API_VERSION}/submissions`, submissionRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/contracts`, contractRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Proof of Crime API',
    version: '1.0.0',
    description: 'Backend API for Proof of Crime Platform',
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// WEBSOCKET
// ============================================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join bounty room
  socket.on('join_bounty', (bountyId) => {
    socket.join(`bounty_${bountyId}`);
    console.log(`User ${socket.id} joined bounty_${bountyId}`);
  });

  // Leave bounty room
  socket.on('leave_bounty', (bountyId) => {
    socket.leave(`bounty_${bountyId}`);
    console.log(`User ${socket.id} left bounty_${bountyId}`);
  });

  // Join submission room
  socket.on('join_submission', (submissionId) => {
    socket.join(`submission_${submissionId}`);
    console.log(`User ${socket.id} joined submission_${submissionId}`);
  });

  // Leave submission room
  socket.on('leave_submission', (submissionId) => {
    socket.leave(`submission_${submissionId}`);
    console.log(`User ${socket.id} left submission_${submissionId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Proof of Crime Backend Server');
  console.log('='.repeat(60));
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await pool.end();
      console.log('Database connections closed');

      await redis.quit();
      console.log('Redis connection closed');

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, io };
