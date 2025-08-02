/**
 * Playwright config for testing real page without dev server
 */

module.exports = {
  testDir: '.',
  timeout: 30000,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  // No webServer - we're using file:// URLs
};