// Authentication setup for E2E tests
import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/');
  
  // Fill in test credentials
  await page.fill('#email', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('#password', process.env.TEST_USER_PASSWORD || 'Test123!');
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to authenticated page
  await page.waitForURL('**/roi-finder.html');
  
  // Verify we're logged in
  await page.waitForSelector('#user-email');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});