const winston = require('winston');
const config = require('../config');

// Custom format for Railway logs
const railwayFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  
  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'starterpack-api' },
  transports: [
    // Console transport for Railway
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        railwayFormat
      )
    })
  ]
});

// Add file transport in development
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

// Create child logger for requests
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

module.exports = logger;