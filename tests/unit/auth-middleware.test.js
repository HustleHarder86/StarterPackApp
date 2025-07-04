// Unit tests for authentication middleware
const authMiddleware = require('../../utils/auth-middleware.js');
const { authenticate, requireSubscription } = authMiddleware.default || authMiddleware;
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

describe('auth-middleware', () => {
  let req, res, next;
  const mockAuth = getAuth();
  const mockDb = getFirestore();
  
  // Create stable mock references
  const mockDoc = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
  
  const mockCollection = {
    doc: jest.fn(() => mockDoc)
  };

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer valid-token'
      },
      method: 'POST',
      ip: '127.0.0.1'
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res)
    };

    next = jest.fn();
    
    // Setup the mock chain
    mockDb.collection.mockReturnValue(mockCollection);
  });

  describe('authenticate', () => {
    test('rejects requests without authorization header', async () => {
      delete req.headers.authorization;
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects invalid tokens', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Invalid token',
        message: 'Authentication failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('authenticates valid tokens and adds user to request', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true
      };
      
      mockAuth.verifyIdToken.mockResolvedValue(mockUser);

      await authenticate(req, res, next);
      
      expect(req.user).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        customClaims: {}
      });
      expect(next).toHaveBeenCalled();
    });

  });

  describe('requireSubscription', () => {
    test('allows access for required tier', async () => {
      req.user = { uid: 'user-123' };
      
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          subscriptionTier: 'pro'
        })
      });
      
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('allows access for higher tier', async () => {
      req.user = { uid: 'user-123' };
      
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          subscriptionTier: 'enterprise'
        })
      });
      
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('denies access for lower tier', async () => {
      req.user = { uid: 'user-123' };
      
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          subscriptionTier: 'free'
        })
      });
      
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient subscription',
        message: 'This feature requires pro subscription or higher',
        currentTier: 'free',
        requiredTier: 'pro'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Rate limiting tests removed - feature not implemented yet
});