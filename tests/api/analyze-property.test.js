// tests/api/analyze-property.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../../api/analyze-property';

describe('/api/analyze-property', () => {
  test('returns 400 for missing address', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { userName: 'Test' }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Property address is required'
    });
  });
  
  // More tests...
});
