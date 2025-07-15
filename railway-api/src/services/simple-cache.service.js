const logger = require('./logger.service');

// Simple in-memory cache implementation
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }
  
  set(key, value, ttlSeconds = 3600) {
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
    
    this.stats.sets++;
    
    // Prevent memory leaks - limit cache size
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }
  
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }
  
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }
  
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

// Create singleton instance
const cacheInstance = new SimpleCache();

// Export compatible interface with old cache service
module.exports = {
  cache: {
    get: (key) => cacheInstance.get(key),
    set: (key, value, ttl) => cacheInstance.set(key, value, ttl),
    del: (key) => cacheInstance.delete(key),
    flush: () => cacheInstance.clear(),
    getStats: () => cacheInstance.getStats()
  },
  getCached: (key) => cacheInstance.get(key),
  setCached: (key, value, ttl) => cacheInstance.set(key, value, ttl)
};