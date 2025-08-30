import { test, expect } from '@playwright/test';

// Test URLs provided by the user
const testUrls = [
  { url: 'https://my.prairie.cards/u/tsukaman', expectedName: 'tsukaman' },
  { url: 'https://my.prairie.cards/u/tananyan29', expectedName: 'tananyan29' },
  { url: 'https://my.prairie.cards/u/jacopen', expectedName: 'jacopen' },
  { url: 'https://my.prairie.cards/u/akane.sakaki', expectedName: 'akane.sakaki' },
  { url: 'https://my.prairie.cards/u/umihico', expectedName: 'umihico' }
];

test.describe('Prairie Card E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000/duo');
  });

  testUrls.forEach(({ url, expectedName }) => {
    test(`should correctly parse Prairie Card for ${expectedName}`, async ({ page }) => {
      // Enter Prairie Card URL for first participant
      await page.fill('input[placeholder*="Prairie Card"]', url);
      
      // Click the add button
      await page.click('button:has-text("追加")');
      
      // Wait for the profile to load
      await page.waitForSelector('[data-testid="participant-card"]', { timeout: 10000 });
      
      // Check that the name is not '名前未設定' or JavaScript code
      const nameElement = await page.locator('[data-testid="participant-name"]');
      const actualName = await nameElement.textContent();
      
      expect(actualName).not.toBe('名前未設定');
      expect(actualName).not.toContain('function');
      expect(actualName).not.toContain('const');
      expect(actualName).not.toContain('var');
      expect(actualName).not.toContain('{');
      expect(actualName).not.toContain('}');
      
      // Check that skills don't contain unrelated tech keywords
      const skillsElements = await page.locator('[data-testid="skill-tag"]').all();
      for (const skill of skillsElements) {
        const skillText = await skill.textContent();
        // Skills should be relevant, not random JavaScript keywords
        expect(skillText).not.toMatch(/^(function|const|var|let|return|if|else|for|while)$/);
      }
      
      // Check that company field doesn't contain JavaScript code
      const companyElement = await page.locator('[data-testid="participant-company"]');
      const companyText = await companyElement.textContent();
      
      if (companyText) {
        expect(companyText).not.toContain('function');
        expect(companyText).not.toContain('=>');
        expect(companyText).not.toContain('const');
      }
    });
  });

  test('should handle multiple Prairie Cards simultaneously', async ({ page }) => {
    // Add first participant
    await page.fill('input[placeholder*="Prairie Card"]:first-of-type', testUrls[0].url);
    await page.click('button:has-text("追加"):first-of-type');
    
    // Add second participant
    await page.fill('input[placeholder*="Prairie Card"]:nth-of-type(2)', testUrls[1].url);
    await page.click('button:has-text("追加"):nth-of-type(2)');
    
    // Wait for both profiles to load
    await page.waitForSelector('[data-testid="participant-card"]', { state: 'attached' });
    
    // Check that both participants are loaded
    const participantCards = await page.locator('[data-testid="participant-card"]').all();
    expect(participantCards).toHaveLength(2);
    
    // Click diagnosis button
    await page.click('button:has-text("診断を開始")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="diagnosis-result"]', { timeout: 15000 });
    
    // Check that results are displayed
    const resultElement = await page.locator('[data-testid="diagnosis-result"]');
    expect(await resultElement.isVisible()).toBe(true);
    
    // Check that compatibility score is reasonable (70-100)
    const scoreElement = await page.locator('[data-testid="compatibility-score"]');
    const scoreText = await scoreElement.textContent();
    const score = parseInt(scoreText || '0');
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });
});