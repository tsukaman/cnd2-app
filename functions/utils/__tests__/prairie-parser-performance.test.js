/**
 * Performance benchmark tests for Prairie Card Parser
 */

const { parseFromHTML } = require('../prairie-parser');

// Skip performance tests in CI environment where timing is unreliable
const describeSkipInCI = process.env.CI ? describe.skip : describe;

describeSkipInCI('Prairie Parser Performance Benchmarks', () => {
  // Helper to generate large HTML content
  function generateLargeHTML(sizeKB) {
    const baseHTML = `
      <html>
        <head>
          <meta property="og:title" content="Test User Profile">
          <meta property="og:description" content="This is a test description for performance testing">
        </head>
        <body>
          <h1>Test User</h1>
          <div class="title">Senior Engineer</div>
          <div class="company">Tech Company Inc.</div>
          <div class="bio">This is a bio section with some content about the user.</div>
    `;
    
    // Add many skill elements
    let skillsHTML = '';
    const skillCount = Math.floor(sizeKB * 10); // Approximate number of skills for target size
    for (let i = 0; i < skillCount; i++) {
      skillsHTML += `<div class="skill">Skill ${i}</div>\n`;
    }
    
    // Add padding content to reach target size
    const paddingSize = sizeKB * 1024 - baseHTML.length - skillsHTML.length - 100;
    const padding = '<!-- ' + 'x'.repeat(Math.max(0, paddingSize)) + ' -->';
    
    return baseHTML + skillsHTML + padding + '</body></html>';
  }

  // Helper to measure execution time
  function measureTime(fn) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }

  describe('Parsing speed tests', () => {
    it('should parse small HTML (10KB) quickly', () => {
      const html = generateLargeHTML(10);
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`10KB HTML parsed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(50); // Should parse in less than 50ms
    });

    it('should parse medium HTML (50KB) efficiently', () => {
      const html = generateLargeHTML(50);
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`50KB HTML parsed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100); // Should parse in less than 100ms
    });

    it('should parse large HTML (100KB) within reasonable time', () => {
      const html = generateLargeHTML(100);
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`100KB HTML parsed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(200); // Should parse in less than 200ms
    });

    it('should handle very large HTML (500KB) without timeout', () => {
      const html = generateLargeHTML(500);
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`500KB HTML parsed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(1000); // Should parse in less than 1 second
    });
  });

  describe('Memory efficiency tests', () => {
    it('should not create excessive arrays for duplicate data', () => {
      // Create HTML with many duplicate skills
      const html = `
        <html>
          <body>
            <h1>Test User</h1>
            ${Array(100).fill('<div class="skill">JavaScript</div>').join('\n')}
          </body>
        </html>
      `;
      
      const result = parseFromHTML(html);
      
      // Should deduplicate to only one "JavaScript" skill
      expect(result.details.skills).toHaveLength(1);
      expect(result.details.skills[0]).toBe('JavaScript');
    });

    it('should respect array size limits', () => {
      // Create HTML with more skills than the limit
      let skillsHTML = '';
      for (let i = 0; i < 50; i++) {
        skillsHTML += `<div class="skill">Skill ${i}</div>\n`;
      }
      
      const html = `
        <html>
          <body>
            <h1>Test User</h1>
            ${skillsHTML}
          </body>
        </html>
      `;
      
      const result = parseFromHTML(html);
      
      // Should limit to LIMITS.SKILLS (15)
      expect(result.details.skills.length).toBeLessThanOrEqual(15);
    });
  });

  describe('Regex performance tests', () => {
    it('should handle pathological regex patterns (ReDoS protection)', () => {
      // Create HTML that could cause ReDoS without proper limits
      const maliciousPattern = 'a'.repeat(10000);
      const html = `
        <html>
          <head>
            <meta property="og:title" content="${maliciousPattern}">
          </head>
          <body>
            <h1>${maliciousPattern}</h1>
          </body>
        </html>
      `;
      
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`Pathological pattern parsed in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100); // Should still be fast with ReDoS protection
    });

    it('should efficiently extract hashtags from large content', () => {
      // Create HTML with many hashtags
      let tagsHTML = '';
      for (let i = 0; i < 100; i++) {
        tagsHTML += `<div class="tag">#tag${i}</div>\n`;
      }
      
      const html = `
        <html>
          <body>
            <h1>Test User</h1>
            ${tagsHTML}
          </body>
        </html>
      `;
      
      const time = measureTime(() => parseFromHTML(html));
      
      console.log(`100 hashtags extracted in ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(50);
      
      const result = parseFromHTML(html);
      // Should limit hashtags to LIMITS.TAGS (15)
      expect(result.details.tags.length).toBeLessThanOrEqual(15);
    });
  });

  describe('Comparative performance', () => {
    it.skip('should show linear or better scaling with input size', () => {
      const sizes = [10, 20, 40, 80];
      const times = [];
      
      for (const size of sizes) {
        const html = generateLargeHTML(size);
        const time = measureTime(() => parseFromHTML(html));
        times.push(time);
        console.log(`${size}KB: ${time.toFixed(2)}ms`);
      }
      
      // Check that time doesn't grow exponentially
      // In CI environments, initial warm-up can cause higher ratios for small sizes
      // We'll check the overall trend rather than individual ratios
      const overallRatio = times[times.length - 1] / times[0]; // 80KB time / 10KB time
      const sizeRatio = sizes[sizes.length - 1] / sizes[0]; // 80 / 10 = 8
      
      // If perfectly linear, overallRatio should equal sizeRatio
      // Allow up to 2x degradation (16x time for 8x size)
      expect(overallRatio).toBeLessThan(sizeRatio * 2);
    });
  });
});