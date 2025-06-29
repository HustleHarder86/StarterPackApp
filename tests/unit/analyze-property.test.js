// Unit tests for analyze-property-enhanced API endpoint
const handler = require('../../api/analyze-property-enhanced.cjs');
const { getFirestore } = require('firebase-admin/firestore');

jest.mock('../../utils/cache-manager.js', () => ({
  getFromCache: jest.fn(() => null),
  setInCache: jest.fn(),
  cacheKeys: {
    propertyAnalysis: jest.fn((id, str) => `analysis:${id}:${str}`)
  }
}));

jest.mock('../../utils/logger.js', () => ({
  loggers: {
    api: {
      child: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }))
    }
  }
}));

jest.mock('../../utils/performance-monitor.js', () => ({
  Timer: jest.fn(() => ({
    end: jest.fn()
  })),
  monitorAPICall: jest.fn((name, fn) => fn())
}));

describe('analyze-property-enhanced', () => {
  let req, res;
  const mockDb = getFirestore();

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        propertyAddress: '123 Main St, Toronto, ON, Canada',
        userId: 'test-user-123',
        includeSTR: false
      },
      headers: {}
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      end: jest.fn(() => res),
      setHeader: jest.fn()
    };

    // Mock Perplexity API key
    process.env.PERPLEXITY_API_KEY = 'pplx-test-key';
    
    // Mock fetch responses
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Average rent is $3,500/month. SOURCE: rentals.ca'
            }
          }]
        })
      })
    );
  });

  test('handles OPTIONS request', async () => {
    req.method = 'OPTIONS';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  test('rejects non-POST requests', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  test('requires property address', async () => {
    delete req.body.propertyAddress;
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Property address or ID is required' 
    });
  });

  test('requires Perplexity API key', async () => {
    delete process.env.PERPLEXITY_API_KEY;
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'API configuration error - Perplexity API key required'
    }));
  });

  test('successfully analyzes property without STR', async () => {
    // Mock Firestore responses
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        subscriptionTier: 'free',
        strTrialUsed: 0
      })
    });

    mockDb.collection().doc().set.mockResolvedValue();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      analysisId: expect.any(String),
      analysis: expect.objectContaining({
        propertyDetails: expect.any(Object),
        costs: expect.any(Object),
        longTermRental: expect.any(Object)
      })
    }));

    // Verify Perplexity API was called
    expect(global.fetch).toHaveBeenCalledTimes(2); // LTR + property research
  });

  test('includes STR analysis for Pro users', async () => {
    req.body.includeSTR = true;
    
    // Mock Pro user
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        subscriptionTier: 'pro',
        strTrialUsed: 0
      })
    });

    mockDb.collection().doc().set.mockResolvedValue();
    mockDb.collection().doc().update.mockResolvedValue();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      analysis: expect.objectContaining({
        strAnalysis: expect.any(Object),
        comparison: expect.any(Object)
      })
    }));

    // Verify STR API was called
    expect(global.fetch).toHaveBeenCalledTimes(3); // LTR + property + STR
  });

  test('handles STR trial limit for free users', async () => {
    req.body.includeSTR = true;
    
    // Mock free user who exhausted trials
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        subscriptionTier: 'free',
        strTrialUsed: 5
      })
    });

    mockDb.collection().doc().set.mockResolvedValue();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.analysis.strAnalysis).toBeUndefined();
    expect(response.strTrialRemaining).toBe(0);
  });

  test('handles API failures gracefully', async () => {
    // Mock API failure
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    mockDb.collection().doc().set.mockResolvedValue();

    await handler(req, res);

    // Should still return analysis with estimated data
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      analysis: expect.objectContaining({
        longTermRental: expect.objectContaining({
          dataSource: 'estimated'
        })
      })
    }));
  });

  test('returns cached analysis when available', async () => {
    const { getFromCache } = require('../../utils/cache-manager.js');
    const cachedData = {
      id: 'cached-analysis-123',
      propertyDetails: { address: '123 Main St' },
      longTermRental: { monthlyRent: 3500 }
    };
    
    getFromCache.mockResolvedValueOnce(cachedData);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      analysisId: 'cached-analysis-123',
      analysis: cachedData,
      cached: true
    }));

    // Should not call external APIs
    expect(global.fetch).not.toHaveBeenCalled();
  });
});