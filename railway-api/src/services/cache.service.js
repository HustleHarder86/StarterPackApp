const Redis = require('redis');
const config = require('../config');
const { redisUrl, redisOptions } = require('../config/redis');
const logger = require('./logger.service');

// Defer Redis client creation until we actually connect
let redisClient;
let publisher;
let subscriber;

// Connect all clients
async function connectRedis() {
  try {
    // Check if we have a valid Redis URL
    if (!redisUrl) {
      logger.warn('No Redis URL configured - running without Redis (fallback mode)');
      return;
    }
    
    // Use the centralized Redis configuration
    logger.debug('Connecting to Redis with URL:', redisUrl.substring(0, 20) + '...');
    
    // Create Redis clients here with explicit URL
    redisClient = Redis.createClient({
      url: redisUrl,
      ...redisOptions
    });
    
    publisher = redisClient.duplicate();
    subscriber = redisClient.duplicate();
    
    await redisClient.connect();
    await publisher.connect();
    await subscriber.connect();
    
    logger.info('Redis connected successfully');
    
    // Handle errors
    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    publisher.on('error', (err) => logger.error('Redis Publisher Error:', err));
    subscriber.on('error', (err) => logger.error('Redis Subscriber Error:', err));
    
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    logger.error('Redis config:', {
      url: config.redis.url?.substring(0, 20) + '...',
      hasRedisUrl: !!process.env.REDIS_URL,
      redisUrlPrefix: process.env.REDIS_URL?.substring(0, 10)
    });
    
    // Don't crash the server if Redis is unavailable
    if (config.nodeEnv === 'production') {
      logger.warn('Running without Redis - caching disabled');
    }
  }
}

// Initialize connections
connectRedis();

// Cache operations with error handling
const cache = {
  async get(key) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, cache get skipped');
        return null;
      }
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },
  
  async set(key, value, ttlSeconds = 3600) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, cache set skipped');
        return false;
      }
      await redisClient.setEx(
        key,
        ttlSeconds,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },
  
  async del(key) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, cache delete skipped');
        return false;
      }
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },
  
  async exists(key) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, cache exists skipped');
        return false;
      }
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },
  
  // Pattern-based deletion
  async delPattern(pattern) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, cache pattern delete skipped');
        return false;
      }
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error:', error);
      return false;
    }
  },
  
  // Get or set pattern
  async getOrSet(key, fetchFunction, ttlSeconds = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug(`Cache hit: ${key}`);
        return cached;
      }
      
      // Fetch fresh data
      logger.debug(`Cache miss: ${key}`);
      const freshData = await fetchFunction();
      
      // Store in cache
      await this.set(key, freshData, ttlSeconds);
      
      return freshData;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // Return fresh data even if caching fails
      return fetchFunction();
    }
  }
};

// Rate limiting helpers
const rateLimiter = {
  async checkLimit(key, maxRequests, windowSeconds) {
    try {
      if (!redisClient) {
        logger.warn('Redis not connected, rate limiting disabled');
        return { allowed: true, current: 0, remaining: maxRequests };
      }
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        // First request, set expiry
        await redisClient.expire(key, windowSeconds);
      }
      
      return {
        allowed: current <= maxRequests,
        current,
        remaining: Math.max(0, maxRequests - current),
        resetIn: await redisClient.ttl(key)
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Allow request if Redis fails
      return { allowed: true, current: 0, remaining: maxRequests };
    }
  }
};

// Simple wrapper functions for backwards compatibility
const getCached = async (key) => cache.get(key);
const setCached = async (key, value, ttl) => cache.set(key, value, ttl);

module.exports = {
  redisClient,
  publisher,
  subscriber,
  cache,
  rateLimiter,
  getCached,
  setCached
};