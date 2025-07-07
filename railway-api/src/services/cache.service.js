const Redis = require('redis');
const config = require('../config');
const logger = require('./logger.service');

// Create Redis client
const redisClient = Redis.createClient({
  url: config.redis.url,
  ...config.redis.options
});

// Create separate client for pub/sub
const publisher = redisClient.duplicate();
const subscriber = redisClient.duplicate();

// Connect all clients
async function connectRedis() {
  try {
    logger.info('=== REDIS DEBUG INFO ===');
    logger.info('NODE_ENV:', process.env.NODE_ENV);
    logger.info('Environment REDIS_URL exists:', !!process.env.REDIS_URL);
    logger.info('Environment REDIS_URL:', process.env.REDIS_URL?.substring(0, 50) + '...');
    logger.info('Config redis URL:', config.redis.url?.substring(0, 50) + '...');
    logger.info('Full process.env keys containing REDIS:', Object.keys(process.env).filter(key => key.includes('REDIS')));
    logger.info('Exact Redis URL being used:', config.redis.url);
    logger.info('========================');
    
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
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },
  
  async set(key, value, ttlSeconds = 3600) {
    try {
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
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },
  
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },
  
  // Pattern-based deletion
  async delPattern(pattern) {
    try {
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

module.exports = {
  redisClient,
  publisher,
  subscriber,
  cache,
  rateLimiter
};