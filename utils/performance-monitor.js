import { loggers } from './logger.js';

/**
 * Performance monitoring utilities
 */

const performanceLogger = loggers.performance;

/**
 * Performance metrics storage
 */
class MetricsStore {
  constructor() {
    this.metrics = new Map();
    this.intervals = new Map();
  }

  record(name, value, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        tags,
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: []
      });
    }
    
    const metric = this.metrics.get(key);
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    
    // Keep last 100 values for percentile calculations
    metric.values.push(value);
    if (metric.values.length > 100) {
      metric.values.shift();
    }
  }

  getKey(name, tags) {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}:${tagStr}`;
  }

  getMetrics() {
    const results = [];
    
    for (const [key, metric] of this.metrics) {
      const sorted = [...metric.values].sort((a, b) => a - b);
      
      results.push({
        name: metric.name,
        tags: metric.tags,
        count: metric.count,
        sum: metric.sum,
        avg: metric.sum / metric.count,
        min: metric.min,
        max: metric.max,
        p50: this.percentile(sorted, 0.5),
        p95: this.percentile(sorted, 0.95),
        p99: this.percentile(sorted, 0.99)
      });
    }
    
    return results;
  }

  percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  reset() {
    this.metrics.clear();
  }
}

// Global metrics store
const metricsStore = new MetricsStore();

/**
 * Performance timer
 */
export class Timer {
  constructor(name, tags = {}) {
    this.name = name;
    this.tags = tags;
    this.startTime = process.hrtime.bigint();
    this.startMemory = process.memoryUsage();
  }

  end(additionalTags = {}) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - this.startTime) / 1000000; // Convert to ms
    const memoryDelta = endMemory.heapUsed - this.startMemory.heapUsed;
    
    const tags = { ...this.tags, ...additionalTags };
    
    // Record metrics
    metricsStore.record(`${this.name}.duration`, duration, tags);
    metricsStore.record(`${this.name}.memory`, memoryDelta, tags);
    
    // Log if slow
    if (duration > 1000) {
      performanceLogger.warn(`Slow operation: ${this.name}`, {
        duration,
        memoryDelta,
        tags
      });
    }
    
    return { duration, memoryDelta };
  }
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware() {
  return (req, res, next) => {
    const timer = new Timer('api.request', {
      method: req.method,
      path: req.path
    });
    
    // Track response time
    res.on('finish', () => {
      const { duration } = timer.end({
        status: res.statusCode,
        statusClass: `${Math.floor(res.statusCode / 100)}xx`
      });
      
      // Add response time header
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
  };
}

/**
 * Monitor async function performance
 */
export function monitor(name, tags = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const timer = new Timer(`${name}.${propertyKey}`, tags);
      
      try {
        const result = await originalMethod.apply(this, args);
        timer.end({ success: true });
        return result;
      } catch (error) {
        timer.end({ success: false, error: error.name });
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Monitor external API calls
 */
export async function monitorAPICall(name, fn, tags = {}) {
  const timer = new Timer(`external.${name}`, tags);
  
  try {
    const result = await fn();
    const { duration } = timer.end({ success: true });
    
    // Log slow API calls
    if (duration > 5000) {
      performanceLogger.warn(`Slow external API call: ${name}`, {
        duration,
        tags
      });
    }
    
    return result;
  } catch (error) {
    timer.end({ 
      success: false, 
      error: error.name,
      status: error.response?.status 
    });
    throw error;
  }
}

/**
 * Monitor database operations
 */
export async function monitorDB(operation, collection, fn) {
  const timer = new Timer('database.operation', {
    operation,
    collection
  });
  
  try {
    const result = await fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.code });
    throw error;
  }
}

/**
 * Memory usage monitor
 */
export function monitorMemory() {
  setInterval(() => {
    const usage = process.memoryUsage();
    
    Object.entries(usage).forEach(([key, value]) => {
      metricsStore.record('process.memory', value, { type: key });
    });
    
    // Alert on high memory usage
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    if (heapPercent > 90) {
      performanceLogger.error('High memory usage detected', {
        heapPercent,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal
      });
    }
  }, 30000); // Every 30 seconds
}

/**
 * CPU usage monitor
 */
let lastCpuUsage = process.cpuUsage();

export function monitorCPU() {
  setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    lastCpuUsage = process.cpuUsage();
    
    const totalCpu = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to ms
    
    metricsStore.record('process.cpu', totalCpu, {
      type: 'total'
    });
    metricsStore.record('process.cpu', currentCpuUsage.user / 1000000, {
      type: 'user'
    });
    metricsStore.record('process.cpu', currentCpuUsage.system / 1000000, {
      type: 'system'
    });
  }, 30000); // Every 30 seconds
}

/**
 * Get current metrics summary
 */
export function getMetricsSummary() {
  const metrics = metricsStore.getMetrics();
  const summary = {};
  
  metrics.forEach(metric => {
    const key = metric.tags.type || 'default';
    if (!summary[metric.name]) {
      summary[metric.name] = {};
    }
    
    summary[metric.name][key] = {
      avg: metric.avg.toFixed(2),
      p95: metric.p95.toFixed(2),
      p99: metric.p99.toFixed(2),
      count: metric.count
    };
  });
  
  return summary;
}

/**
 * Export metrics endpoint
 */
export function metricsEndpoint(req, res) {
  const summary = getMetricsSummary();
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics: summary,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
}

/**
 * Start monitoring
 */
export function startMonitoring() {
  monitorMemory();
  monitorCPU();
  
  // Reset metrics every hour
  setInterval(() => {
    const summary = getMetricsSummary();
    performanceLogger.info('Hourly metrics summary', summary);
    metricsStore.reset();
  }, 3600000);
  
  performanceLogger.info('Performance monitoring started');
}

export default {
  Timer,
  performanceMiddleware,
  monitor,
  monitorAPICall,
  monitorDB,
  getMetricsSummary,
  metricsEndpoint,
  startMonitoring
};