// Simple test to verify setup is working
describe('Test Setup', () => {
  test('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  test('Math operations work', () => {
    expect(2 + 2).toBe(4);
    expect(10 * 5).toBe(50);
  });

  test('Environment variables are loaded', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});