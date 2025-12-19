const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../config/logger');
const { getCacheStats, clearAllCaches } = require('../middleware/cache');
const router = express.Router();

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
  // Add your admin authentication logic here
  // For now, we'll assume it's handled by your existing auth middleware
  next();
};

// Get performance metrics
router.get('/performance', requireAdmin, async (req, res) => {
  try {
    // Mock performance data - in production, you'd get this from your monitoring system
    const performanceData = [];
    const now = Date.now();
    
    // Generate last 24 hours of data
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now - (i * 60 * 60 * 1000)).toISOString();
      performanceData.push({
        timestamp,
        avgResponseTime: Math.random() * 1000 + 200, // 200-1200ms
        errorRate: Math.random() * 5, // 0-5%
        requestCount: Math.floor(Math.random() * 1000) + 100,
        cpuUsage: Math.random() * 80 + 10, // 10-90%
        memoryUsage: Math.random() * 70 + 20 // 20-90%
      });
    }

    res.json(performanceData);
  } catch (error) {
    logger.error('Failed to fetch performance metrics', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
});

// Get error logs
router.get('/errors', requireAdmin, async (req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'error.log');
    
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const errorLogs = lines.slice(-50).map(line => {
        try {
          const logEntry = JSON.parse(line);
          return {
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            source: logEntry.service || 'Backend',
            stack: logEntry.stack,
            url: logEntry.url,
            userId: logEntry.userId
          };
        } catch (parseError) {
          return {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: line,
            source: 'Backend'
          };
        }
      }).reverse();

      res.json(errorLogs);
    } catch (fileError) {
      // If log file doesn't exist, return empty array
      res.json([]);
    }
  } catch (error) {
    logger.error('Failed to fetch error logs', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch error logs' });
  }
});

// Get security events
router.get('/security', requireAdmin, async (req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'security.log');
    
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const securityEvents = lines.slice(-50).map(line => {
        try {
          const logEntry = JSON.parse(line);
          return {
            timestamp: logEntry.timestamp,
            eventType: logEntry.event || 'UNKNOWN',
            ipAddress: logEntry.ip || 'Unknown',
            userId: logEntry.userId || 'Anonymous',
            severity: logEntry.severity || 'MEDIUM',
            details: logEntry.details || logEntry.message,
            userAgent: logEntry.userAgent
          };
        } catch (parseError) {
          return {
            timestamp: new Date().toISOString(),
            eventType: 'PARSE_ERROR',
            ipAddress: 'Unknown',
            userId: 'System',
            severity: 'LOW',
            details: line
          };
        }
      }).reverse();

      res.json(securityEvents);
    } catch (fileError) {
      // If log file doesn't exist, return empty array
      res.json([]);
    }
  } catch (error) {
    logger.error('Failed to fetch security events', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch security events' });
  }
});

// Get cache statistics
router.get('/cache', requireAdmin, (req, res) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch cache stats', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch cache statistics' });
  }
});

// Clear cache
router.post('/cache/clear', requireAdmin, (req, res) => {
  try {
    clearAllCaches();
    logger.info('Cache cleared by admin', { userId: req.user?.userId });
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({ message: 'Failed to clear cache' });
  }
});

// Download logs
router.get('/logs/:type/download', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['error', 'security', 'combined'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid log type' });
    }

    const logPath = path.join(process.cwd(), 'logs', `${type}.log`);
    
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-logs-${new Date().toISOString().split('T')[0]}.log"`);
      
      res.send(logContent);
      
      logger.info('Log file downloaded', { 
        type, 
        userId: req.user?.userId,
        ip: req.ip 
      });
    } catch (fileError) {
      res.status(404).json({ message: 'Log file not found' });
    }
  } catch (error) {
    logger.error('Failed to download logs', { error: error.message });
    res.status(500).json({ message: 'Failed to download logs' });
  }
});

// Get system metrics
router.get('/system', requireAdmin, (req, res) => {
  try {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to fetch system metrics', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch system metrics' });
  }
});

// Get real-time alerts
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    // Check for various alert conditions
    const alerts = [];

    // Check error rate
    const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
    try {
      const errorContent = await fs.readFile(errorLogPath, 'utf8');
      const recentErrors = errorContent.split('\n').filter(line => {
        if (!line.trim()) return false;
        try {
          const log = JSON.parse(line);
          const logTime = new Date(log.timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return logTime > oneHourAgo;
        } catch {
          return false;
        }
      });

      if (recentErrors.length > 10) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: 'HIGH',
          message: `High error rate detected: ${recentErrors.length} errors in the last hour`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (fileError) {
      // Log file doesn't exist, no errors to report
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > 80) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'MEDIUM',
        message: `High memory usage: ${memUsagePercent.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(alerts);
  } catch (error) {
    logger.error('Failed to fetch alerts', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

module.exports = router;