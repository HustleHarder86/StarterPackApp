const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./services/logger.service');
const corsMiddleware = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Trust proxy (Railway runs behind a proxy)
app.set('trust proxy', true);

// Force redeploy - 2025-07-15 19:45

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(corsMiddleware);

// Log all OPTIONS requests for debugging
app.options('*', (req, res, next) => {
  logger.debug('OPTIONS request received', {
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(logger.requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip
});

app.use('/api/', limiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'StarterPackApp Railway API',
    status: 'operational',
    version: '1.0.2', // Updated to trigger redeploy
    endpoints: {
      health: '/health',
      analysis: '/api/analysis/*',
      jobs: '/api/jobs/*',
      reports: '/api/reports/*'
    },
    deployment: new Date().toISOString()
  });
});

// Health check route
app.use('/health', require('./routes/health'));

// API routes
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/appreciation', require('./routes/appreciation'));

// Debug routes
app.use('/api/debug', require('./routes/debug'));
// Mount cors-debug routes under the same /api/debug path
const corsDebugRouter = require('./routes/cors-debug');
app.use('/api/debug', corsDebugRouter);

// Debug route to list all available routes
app.get('/api/debug/routes', (req, res) => {
  res.json({
    availableRoutes: [
      'GET /health',
      'POST /api/analysis/property',
      'POST /api/analysis/str', 
      'POST /api/analysis/comparables',
      'POST /api/reports/generate',
      'GET /api/reports/download/:reportId',
      'GET /api/jobs/:jobId/status'
    ],
    message: 'These are the available API endpoints'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Railway API server listening on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS origins: ${config.cors.origin.join(', ')}`);
});