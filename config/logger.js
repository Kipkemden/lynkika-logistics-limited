const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance - serverless friendly (console only)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'lynkika-logistics' },
  transports: [
    // Console only for serverless environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Security event logger
const logSecurityEvent = (event, userId, details, ip, userAgent) => {
  logger.warn('Security Event', {
    event,
    userId,
    details,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    severity: 'HIGH'
  });
};

// Performance logger
const logPerformance = (operation, duration, details) => {
  logger.info('Performance Metric', {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString()
  });
};

// Business event logger
const logBusinessEvent = (event, userId, details) => {
  logger.info('Business Event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  logSecurityEvent,
  logPerformance,
  logBusinessEvent
};