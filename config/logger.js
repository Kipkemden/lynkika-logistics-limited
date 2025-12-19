const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'lynkika-logistics' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Security audit logs
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

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