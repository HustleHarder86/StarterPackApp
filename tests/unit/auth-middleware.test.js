// Unit tests for authentication middleware
const authMiddleware = require('../../utils/auth-middleware.js');
const { authenticate, requireSubscription } = authMiddleware.default || authMiddleware;
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

describe('auth-middleware', () => {
  let req, res, next;
  const mockAuth = getAuth();
  const mockDb = getFirestore();

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
  });

  describe('authenticate', () => {
    test('rejects requests without authorization header', async () => {
      delete req.headers.authorization;
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects invalid tokens', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
      
      await authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('authenticates valid tokens and adds user to request', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com'
      };
      
      mockAuth.verifyIdToken.mockResolvedValue(mockUser);
      mockDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'test@example.com',
          subscriptionTier: 'pro'
        })
      });

      await authenticate(req, res, next);
      
      expect(req.user).toEqual(expect.objectContaining({
        uid: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'pro'
      }));
      expect(next).toHaveBeenCalled();
    });

    test('creates user document if it does not exist', async () => {
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'new-user',
        email: 'new@example.com'
      });
      
      mockDb.collection().doc().get.mockResolvedValue({
        exists: false
      });

      await authenticate(req, res, next);
      
      expect(mockDb.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          subscriptionTier: 'free',
          monthlyAnalysisCount: 0
        })
      );
    });
  });

  describe('requireSubscription', () => {
    test('allows access for required tier', async () => {
      req.user = { subscriptionTier: 'pro' };
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('allows access for higher tier', async () => {
      req.user = { subscriptionTier: 'enterprise' };
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('denies access for lower tier', async () => {
      req.user = { subscriptionTier: 'free' };
      const middleware = requireSubscription('pro');
      
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient subscription tier',
        required: 'pro',
        current: 'free'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Rate limiting tests removed - feature not implemented yet
});