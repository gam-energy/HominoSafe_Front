import { test, expect } from '@playwright/test';

test('verify sign-in page and language toggle', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/sign-in');
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Welcome Back")');
  
  // Take screenshot in English
  await page.screenshot({ path: 'verification/screenshots/signin_en.png' });
  
  // Toggle to Farsi
  const toggleButton = page.locator('button:has-text("FA")');
  await toggleButton.click();
  
  // Wait for Farsi text
  await page.waitForSelector('h1:has-text("خوش آمدید")');
  
  // Verify RTL
  const htmlDir = await page.getAttribute('html', 'dir');
  expect(htmlDir).toBe('rtl');
  
  // Take screenshot in Farsi
  await page.screenshot({ path: 'verification/screenshots/signin_fa.png' });
});
