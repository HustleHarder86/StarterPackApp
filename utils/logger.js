import { db } from './firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Structured logging system for InvestorProps
 * Logs to console in development, Firestore in production
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_COLLECTION = 'logs';
const MAX_LOG_SIZE = 5000; // Max characters per log entry

class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.level = process.env.LOG_LEVEL ? 
      LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 
      (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);
    this.batchLogs = [];
    this.batchTimer = null;
  }

  /**
   * Format log entry
   */
  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level),
      context: this.context,
      message,
      ...this.sanitizeData(data),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    };

    // Add request context if available
    if (data.req) {
      logEntry.request = {
        method: data.req.method,
        url: data.req.url,
        headers: this.sanitizeHeaders(data.req.headers),
        ip: data.req.ip || data.req.connection?.remoteAddress,
        userAgent: data.req.headers?.['user-agent']
      };
      delete data.req;
    }

    // Add user context if available
    if (data.userId || data.user) {
      logEntry.user = {
        id: data.userId || data.user?.uid,
        email: data.user?.email
      };
      delete data.userId;
      delete data.user;
    }

    // Add error details if present
    if (data.error || data.err) {
      const error = data.error || data.err;
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
      delete data.error;
      delete data.err;
    }

    return logEntry;
  }

  /**
   * Sanitize sensitive data
   */
  sanitizeData(data) {
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Write log to console
   */
  writeToConsole(logEntry) {
    const { timestamp, level, context, message, ...data } = logEntry;
    const prefix = `[${timestamp}] [${level}] [${context}]`;
    
    switch (level) {
      case 'ERROR':
        console.error(prefix, message, data);
        break;
      case 'WARN':
        console.warn(prefix, message, data);
        break;
      case 'INFO':
        console.info(prefix, message, data);
        break;
      case 'DEBUG':
      case 'TRACE':
        console.log(prefix, message, data);
        break;
    }
  }

  /**
   * Write log to Firestore (batched for performance)
   */
  async writeToFirestore(logEntry) {
    // Truncate message if too long
    if (logEntry.message && logEntry.message.length > MAX_LOG_SIZE) {
      logEntry.message = logEntry.message.substring(0, MAX_LOG_SIZE) + '... [TRUNCATED]';
    }
    
    this.batchLogs.push({
      ...logEntry,
      createdAt: FieldValue.serverTimestamp()
    });
    
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set new timer to flush logs
    this.batchTimer = setTimeout(() => this.flushLogs(), 1000);
    
    // Flush immediately if batch is large
    if (this.batchLogs.length >= 10) {
      await this.flushLogs();
    }
  }

  /**
   * Flush batched logs to Firestore
   */
  async flushLogs() {
    if (this.batchLogs.length === 0) return;
    
    const logs = [...this.batchLogs];
    this.batchLogs = [];
    
    try {
      const batch = db.batch();
      
      logs.forEach(log => {
        const docRef = db.collection(LOG_COLLECTION).doc();
        batch.set(docRef, log);
      });
      
      await batch.commit();
    } catch (error) {
      // Fallback to console if Firestore fails
      console.error('Failed to write logs to Firestore:', error);
      logs.forEach(log => this.writeToConsole(log));
    }
  }

  /**
   * Log methods
   */
  async log(level, message, data = {}) {
    if (level > this.level) return;
    
    const logEntry = this.formatLog(level, message, data);
    
    // Always write to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.writeToConsole(logEntry);
    }
    
    // Write to Firestore in production for important logs
    if (process.env.NODE_ENV === 'production' && level <= LOG_LEVELS.WARN) {
      await this.writeToFirestore(logEntry);
    }
  }

  error(message, data = {}) {
    return this.log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = {}) {
    return this.log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = {}) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = {}) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  trace(message, data = {}) {
    return this.log(LOG_LEVELS.TRACE, message, data);
  }

  /**
   * Create child logger with additional context
   */
  child(childContext) {
    return new Logger(`${this.context}:${childContext}`);
  }

  /**
   * Performance logging
   */
  startTimer(label) {
    const start = Date.now();
    return {
      end: (data = {}) => {
        const duration = Date.now() - start;
        this.info(`${label} completed`, { duration, ...data });
      }
    };
  }

  /**
   * API request logging middleware
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      const requestId = Math.random().toString(36).substring(7);
      
      // Add request ID to request
      req.requestId = requestId;
      
      // Log request
      this.info('API Request', {
        requestId,
        req,
        body: req.body ? '[BODY]' : undefined
      });
      
      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - start;
        
        // Log response
        this.info('API Response', {
          requestId,
          statusCode: res.statusCode,
          duration,
          req
        });
        
        // Call original end
        originalEnd.apply(res, args);
      }.bind(this);
      
      next();
    };
  }
}

/**
 * Create logger instances for different contexts
 */
export const loggers = {
  api: new Logger('api'),
  auth: new Logger('auth'),
  db: new Logger('database'),
  cache: new Logger('cache'),
  external: new Logger('external-api'),
  performance: new Logger('performance')
};

/**
 * Query logs from Firestore
 */
export async function queryLogs(options = {}) {
  const {
    level,
    context,
    startTime,
    endTime,
    limit = 100,
    userId
  } = options;
  
  try {
    let query = db.collection(LOG_COLLECTION);
    
    if (level) {
      query = query.where('level', '==', level);
    }
    
    if (context) {
      query = query.where('context', '==', context);
    }
    
    if (userId) {
      query = query.where('user.id', '==', userId);
    }
    
    if (startTime) {
      query = query.where('timestamp', '>=', startTime);
    }
    
    if (endTime) {
      query = query.where('timestamp', '<=', endTime);
    }
    
    query = query.orderBy('timestamp', 'desc').limit(limit);
    
    const snapshot = await query.get();
    const logs = [];
    
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('Error querying logs:', error);
    return [];
  }
}

/**
 * Clean up old logs
 */
export async function cleanupOldLogs(daysToKeep = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const oldLogs = await db.collection(LOG_COLLECTION)
      .where('timestamp', '<', cutoffDate.toISOString())
      .limit(500) // Process in batches
      .get();
    
    if (oldLogs.empty) {
      return { deleted: 0 };
    }
    
    const batch = db.batch();
    oldLogs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { deleted: oldLogs.size };
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return { deleted: 0, error: error.message };
  }
}

// Default export
export default new Logger('app');