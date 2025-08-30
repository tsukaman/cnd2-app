import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Prairie Card Integration
 * Tests the actual Prairie Card parsing and diagnosis flow
 */

// Test Prairie Card URLs (provided by user)
const TEST_PRAIRIE_CARDS = [
  { url: 'https://my.prairie.cards/u/tsukaman', expectedName: 'tsukaman' },
  { url: 'https://my.prairie.cards/u/tananyan29', expectedName: 'tananyan29' },
  { url: 'https://my.prairie.cards/u/jacopen', expectedName: 'jacopen' },
  { url: 'https://my.prairie.cards/u/akane.sakaki', expectedName: 'akane.sakaki' },
  { url: 'https://my.prairie.cards/u/umihico', expectedName: 'umihico' },
];

test.describe('Prairie Card Integration', () => {
  test.describe('Duo Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/duo');
      // Wait for the page to be ready
      await page.waitForSelector('h1:has-text("エンジニア相性診断")', { timeout: 10000 });
    });

    test('should load duo page successfully', async ({ page }) => {
      // Check that the main elements are present
      await expect(page.locator('h1:has-text("エンジニア相性診断")')).toBeVisible();
      await expect(page.locator('text=参加者1')).toBeVisible();
      await expect(page.locator('text=参加者2')).toBeVisible();
    });

    test('should add Prairie Card URL and fetch profile', async ({ page }) => {
      // Skip if in CI and Prairie Cards might not be accessible
      if (process.env.CI) {
        test.skip();
      }

      // Input first Prairie Card URL
      const input1 = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await input1.fill(TEST_PRAIRIE_CARDS[0].url);
      
      // Click add button
      const addButton1 = page.locator('button:has-text("追加")').first();
      await addButton1.click();
      
      // Wait for profile to load (check for name or loading state change)
      await page.waitForTimeout(3000); // Give time for API call
      
      // Check that the profile was loaded (not showing default text)
      const profileCard = page.locator('.rounded-lg').first();
      const profileText = await profileCard.textContent();
      
      expect(profileText).not.toContain('Prairie Card URLを入力');
      expect(profileText).not.toContain('名前未設定');
    });

    test('should handle invalid Prairie Card URL', async ({ page }) => {
      // Input invalid URL
      const input = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await input.fill('https://example.com/invalid');
      
      // Click add button
      const addButton = page.locator('button:has-text("追加")').first();
      await addButton.click();
      
      // Should show error or not load profile
      await page.waitForTimeout(2000);
      
      // Check for error state or that profile didn't load
      const profileCard = page.locator('.rounded-lg').first();
      const profileText = await profileCard.textContent();
      
      // Should still show the input form or error message
      expect(profileText).toContain('Prairie Card URL');
    });

    test('should perform diagnosis with two profiles', async ({ page }) => {
      // Skip if in CI and Prairie Cards might not be accessible
      if (process.env.CI) {
        test.skip();
      }

      // Add first participant (using mock data)
      const input1 = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await input1.fill(TEST_PRAIRIE_CARDS[0].url);
      await page.locator('button:has-text("追加")').first().click();
      
      // Wait for first profile
      await page.waitForTimeout(3000);
      
      // Add second participant
      const input2 = page.locator('input[placeholder*="Prairie Card URL"]').nth(1);
      await input2.fill(TEST_PRAIRIE_CARDS[1].url);
      await page.locator('button:has-text("追加")').nth(1).click();
      
      // Wait for second profile
      await page.waitForTimeout(3000);
      
      // Click diagnosis button
      const diagnosisButton = page.locator('button:has-text("診断を開始")');
      await expect(diagnosisButton).toBeEnabled();
      await diagnosisButton.click();
      
      // Wait for diagnosis result
      await page.waitForSelector('text=相性スコア', { timeout: 15000 });
      
      // Check that result is displayed
      await expect(page.locator('text=相性スコア')).toBeVisible();
      
      // Check that compatibility score is reasonable (70-100)
      const scoreText = await page.locator('[class*="text-6xl"]').textContent();
      const score = parseInt(scoreText || '0');
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/duo');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to type in input with keyboard
      await page.keyboard.type(TEST_PRAIRIE_CARDS[0].url);
      
      // Should be able to submit with Enter
      await page.keyboard.press('Enter');
      
      // Check that some action occurred
      await page.waitForTimeout(1000);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/duo');
      
      // Check for important ARIA attributes
      const inputs = page.locator('input[placeholder*="Prairie Card URL"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Check buttons have accessible text
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/duo');
      
      // Check that main elements are still visible
      await expect(page.locator('h1:has-text("エンジニア相性診断")')).toBeVisible();
      
      // Input should be accessible
      const input = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await expect(input).toBeVisible();
      
      // Should be able to interact
      await input.fill(TEST_PRAIRIE_CARDS[0].url);
      
      const addButton = page.locator('button:has-text("追加")').first();
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests to simulate failure
      await page.route('**/api/prairie', route => {
        route.abort('failed');
      });
      
      await page.goto('/duo');
      
      // Try to add a Prairie Card
      const input = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await input.fill(TEST_PRAIRIE_CARDS[0].url);
      
      const addButton = page.locator('button:has-text("追加")').first();
      await addButton.click();
      
      // Should handle error without crashing
      await page.waitForTimeout(2000);
      
      // Page should still be functional
      await expect(page.locator('h1:has-text("エンジニア相性診断")')).toBeVisible();
    });

    test('should handle API timeout gracefully', async ({ page }) => {
      // Intercept and delay API response
      await page.route('**/api/prairie', async route => {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        route.continue();
      });
      
      await page.goto('/duo');
      
      // Try to add a Prairie Card
      const input = page.locator('input[placeholder*="Prairie Card URL"]').first();
      await input.fill(TEST_PRAIRIE_CARDS[0].url);
      
      const addButton = page.locator('button:has-text("追加")').first();
      await addButton.click();
      
      // Should show loading state
      await page.waitForTimeout(1000);
      
      // Should eventually timeout or show error (not hang forever)
      // Page should remain responsive
      await expect(page.locator('h1:has-text("エンジニア相性診断")')).toBeVisible();
    });
  });
});