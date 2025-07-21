const { test, expect } = require('@playwright/test');

test('capture screenshot', async ({ page }) => {
  await page.goto('/roi-finder.html');
  await page.screenshot({ path: 'tests/e2e/screenshots/test.png' });
});
