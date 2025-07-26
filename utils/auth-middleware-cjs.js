/**
 * CommonJS wrapper for auth-middleware
 * This allows CommonJS API files to use the ES6 auth middleware
 */

// Dynamic import wrapper for ES6 module
let authModule = null;

async function loadAuthModule() {
  if (!authModule) {
    authModule = await import('./auth-middleware.js');
  }
  return authModule;
}

// Wrapped authenticate function
async function authenticate(req, res, next) {
  const module = await loadAuthModule();
  return module.authenticate(req, res, next);
}

// Wrapped optionalAuth function
async function optionalAuth(req, res, next) {
  const module = await loadAuthModule();
  return module.optionalAuth(req, res, next);
}

// Wrapped requireSubscription function
function requireSubscription(tier) {
  return async (req, res, next) => {
    const module = await loadAuthModule();
    const middleware = module.requireSubscription(tier);
    return middleware(req, res, next);
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireSubscription
};