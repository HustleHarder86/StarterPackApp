const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Default test user credentials
    // storageState: 'tests/e2e/.auth/user.json', // Commented out for visual tests
  },
  
  // Extended timeout for visual tests that call real APIs
  timeout: 90 * 1000, // 90 seconds per test
  expect: {
    timeout: 65 * 1000 // 65 seconds for assertions (API can take up to 60s)
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // dependencies: ['setup'], // Commented out for visual tests
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  // Run local dev servers before starting tests
  // NOTE: Always test locally first using the dev servers!
  webServer: process.env.CI ? undefined : [
    {
      command: 'npm run dev:vercel',
      port: 3000,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev:railway',
      port: 3001,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    }
  ],
});