const NodeCache = require('node-cache');
const { logger } = require('../config/logger');

// Create cache instances with different TTL
const shortCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const mediumCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

// Cache middleware factory
const createCacheMiddleware = (duration = 'medium') => {
  const cache = {
    short: shortCache,
    medium: mediumCache,
    long: longCache
  }[duration] || mediumCache;

  return (req, res, next) => {
    // Skip caching for authenticated requests
    if (req.headers.authorization) {
      return next();
    }

    // Create cache key from URL and query params
    const cacheKey = `${req.method}:${req.originalUrl}`;
    
    try {
      const cachedResponse = cache.get(cacheKey);
      
      if (cachedResponse) {
        logger.info('Cache Hit', {
          key: cacheKey,
          duration,
          timestamp: new Date().toISOString()
        });
        
        res.set('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cache.set(cacheKey, data);
          logger.info('Cache Set', {
            key: cacheKey,
            duration,
            timestamp: new Date().toISOString()
          });
        }
        
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache Error', {
        error: error.message,
        key: cacheKey
      });
      next();
    }
  };
};

// Cache invalidation utilities
const invalidateCache = (pattern) => {
  try {
    [shortCache, mediumCache, longCache].forEach(cache => {
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.del(key);
          logger.info('Cache Invalidated', { key, pattern });
        }
      });
    });
  } catch (error) {
    logger.error('Cache Invalidation Error', {
      error: error.message,
      pattern
    });
  }
};

// Cache statistics
const getCacheStats = () => {
  return {
    short: shortCache.getStats(),
    medium: mediumCache.getStats(),
    long: longCache.getStats()
  };
};

// Clear all caches
const clearAllCaches = () => {
  shortCache.flushAll();
  mediumCache.flushAll();
  longCache.flushAll();
  logger.info('All caches cleared');
};

module.exports = {
  cache: createCacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearAllCaches
};