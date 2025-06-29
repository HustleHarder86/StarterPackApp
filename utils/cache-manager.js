import { db } from './firebase-admin.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Cache manager for API responses and expensive operations
 * Uses Firestore for distributed caching in serverless environment
 */

const CACHE_COLLECTION = 'cache';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Cache key generators
 */
export const cacheKeys = {
  propertyAnalysis: (propertyId, includeSTR) => 
    `analysis:${propertyId}:${includeSTR ? 'with-str' : 'basic'}`,
  
  marketResearch: (address, type) => 
    `market:${type}:${address.toLowerCase().replace(/\s+/g, '-')}`,
  
  userProperties: (userId) => 
    `user-properties:${userId}`,
  
  strComparables: (location, propertyType) => 
    `str-comparables:${location}:${propertyType}`,
  
  rentalRates: (city, bedrooms, propertyType) => 
    `rental-rates:${city}:${bedrooms}:${propertyType}`
};

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null if not found/expired
 */
export async function getFromCache(key) {
  try {
    const db = admin.firestore();
    const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    const now = Date.now();
    
    // Check if expired
    if (data.expiresAt && data.expiresAt.toMillis() < now) {
      // Clean up expired entry
      await doc.ref.delete();
      return null;
    }
    
    // Update last accessed time for LRU
    await doc.ref.update({
      lastAccessed: FieldValue.serverTimestamp(),
      accessCount: FieldValue.increment(1)
    });
    
    return data.value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function setInCache(key, value, ttl = DEFAULT_TTL) {
  try {
    const expiresAt = new Date(Date.now() + (ttl * 1000));
    
    await db.collection(CACHE_COLLECTION).doc(key).set({
      value,
      createdAt: FieldValue.serverTimestamp(),
      lastAccessed: FieldValue.serverTimestamp(),
      expiresAt,
      ttl,
      accessCount: 0,
      size: JSON.stringify(value).length
    });
    
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete item from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromCache(key) {
  try {
    await db.collection(CACHE_COLLECTION).doc(key).delete();
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Clear expired cache entries
 * Should be called periodically by a cron job
 */
export async function clearExpiredCache() {
  try {
    const now = Timestamp.now();
    
    const expired = await db.collection(CACHE_COLLECTION)
      .where('expiresAt', '<', now)
      .limit(100) // Process in batches
      .get();
    
    if (expired.empty) {
      return { cleared: 0 };
    }
    
    const batch = db.batch();
    expired.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { cleared: expired.size };
  } catch (error) {
    console.error('Clear expired cache error:', error);
    return { cleared: 0, error: error.message };
  }
}

/**
 * Get or set cache with function
 * @param {string} key - Cache key
 * @param {Function} fn - Function to call if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
export async function cacheable(key, fn, ttl = DEFAULT_TTL) {
  // Try to get from cache first
  const cached = await getFromCache(key);
  if (cached !== null) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }
  
  console.log(`Cache miss: ${key}`);
  
  // Call function to get fresh data
  const freshData = await fn();
  
  // Store in cache (don't await to not block response)
  setInCache(key, freshData, ttl).catch(error => {
    console.error('Failed to cache data:', error);
  });
  
  return freshData;
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Key pattern to match
 * @returns {Promise<number>} Number of entries invalidated
 */
export async function invalidateCacheByPattern(pattern) {
  try {
    
    // Note: Firestore doesn't support pattern matching in queries
    // In production, consider using Redis for more advanced caching
    const allDocs = await db.collection(CACHE_COLLECTION)
      .where('key', '>=', pattern)
      .where('key', '<', pattern + '\uf8ff')
      .get();
    
    if (allDocs.empty) {
      return 0;
    }
    
    const batch = db.batch();
    allDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return allDocs.size;
  } catch (error) {
    console.error('Invalidate cache error:', error);
    return 0;
  }
}

/**
 * Cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  try {
    const snapshot = await db.collection(CACHE_COLLECTION).get();
    
    let totalSize = 0;
    let totalAccess = 0;
    let expiredCount = 0;
    const now = Date.now();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalSize += data.size || 0;
      totalAccess += data.accessCount || 0;
      
      if (data.expiresAt && data.expiresAt.toMillis() < now) {
        expiredCount++;
      }
    });
    
    return {
      totalEntries: snapshot.size,
      totalSize,
      totalAccess,
      expiredCount,
      averageAccessPerEntry: snapshot.size > 0 ? totalAccess / snapshot.size : 0
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

/**
 * Middleware for caching API responses
 */
export function cacheMiddleware(options = {}) {
  const {
    keyGenerator = (req) => `${req.method}:${req.url}`,
    ttl = DEFAULT_TTL,
    condition = () => true
  } = options;
  
  return async (req, res, next) => {
    // Only cache GET requests by default
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }
    
    const key = keyGenerator(req);
    
    // Try to get from cache
    const cached = await getFromCache(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      res.setHeader('X-Cache', 'MISS');
      
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setInCache(key, data, ttl).catch(error => {
          console.error('Failed to cache response:', error);
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

export default {
  cacheKeys,
  getFromCache,
  setInCache,
  deleteFromCache,
  clearExpiredCache,
  cacheable,
  invalidateCacheByPattern,
  getCacheStats,
  cacheMiddleware
};