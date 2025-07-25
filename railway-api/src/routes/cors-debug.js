const express = require('express');
const config = require('../config');
const logger = require('../services/logger.service');

const router = express.Router();

/**
 * Debug endpoint to check CORS configuration
 * Only available in non-production environments
 */
router.get('/cors-config', (req, res) => {
  const origin = req.headers.origin || 'No origin header';
  const allowedOrigins = config.cors.origin;
  const isAllowed = !req.headers.origin || allowedOrigins.includes(req.headers.origin);
  
  logger.info('CORS debug check', {
    requestOrigin: origin,
    allowedOrigins: allowedOrigins,
    isAllowed: isAllowed,
    envVar: process.env.ALLOWED_ORIGINS
  });
  
  res.json({
    requestOrigin: origin,
    allowedOrigins: allowedOrigins,
    isAllowed: isAllowed,
    rawEnvVar: process.env.ALLOWED_ORIGINS,
    nodeEnv: process.env.NODE_ENV,
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer
    }
  });
});

module.exports = router;