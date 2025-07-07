require('dotenv').config();

// Debug environment loading
console.log('=== CONFIG DEBUG ===');
console.log('REDIS_URL from env:', process.env.REDIS_URL);
console.log('All env vars with REDIS:', Object.keys(process.env).filter(k => k.includes('REDIS')));
console.log('===================');

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  },
  
  // AI APIs
  apis: {
    perplexity: {
      key: process.env.PERPLEXITY_API_KEY,
      url: 'https://api.perplexity.ai'
    },
    openai: {
      key: process.env.OPENAI_API_KEY
    },
    airbnb: {
      key: process.env.AIRBNB_SCRAPER_API_KEY,
      url: process.env.AIRBNB_SCRAPER_API_URL
    }
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false
    }
  },
  
  // CORS
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Security
  security: {
    internalApiKey: process.env.INTERNAL_API_KEY
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required configuration
const requiredConfigs = [
  'firebase.projectId',
  'firebase.clientEmail',
  'firebase.privateKey',
  'apis.perplexity.key'
];

function validateConfig() {
  const missing = [];
  
  requiredConfigs.forEach(path => {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (!value) {
      missing.push(path);
    }
  });
  
  if (missing.length > 0) {
    console.error('Missing required configuration:', missing.join(', '));
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

validateConfig();

module.exports = config;