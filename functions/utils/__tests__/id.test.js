import { generateId, validateId, ID_PATTERN } from '../id.js';

describe('ID Utilities', () => {
  describe('generateId', () => {
    it('should generate ID with minimum 8 characters', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateId();
        expect(id.length).toBeGreaterThanOrEqual(8);
      }
    });

    it('should generate ID with maximum 20 characters', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateId();
        expect(id.length).toBeLessThanOrEqual(20);
      }
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate lowercase alphanumeric IDs only', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateId();
        expect(id).toMatch(/^[a-z0-9]+$/);
      }
    });
  });

  describe('validateId', () => {
    it('should accept valid IDs', () => {
      expect(validateId('abcd1234')).toBe(true);
      expect(validateId('12345678')).toBe(true);
      expect(validateId('abcdefghijklmnopqrst')).toBe(true); // 20 chars
    });

    it('should reject IDs shorter than 8 characters', () => {
      expect(validateId('abc123')).toBe(false);
      expect(validateId('1234567')).toBe(false);
    });

    it('should reject IDs longer than 20 characters', () => {
      expect(validateId('abcdefghijklmnopqrstuvwxyz')).toBe(false);
    });

    it('should reject IDs with uppercase letters', () => {
      expect(validateId('ABCD1234')).toBe(false);
      expect(validateId('abcdEFGH')).toBe(false);
    });

    it('should reject IDs with special characters', () => {
      expect(validateId('abcd-1234')).toBe(false);
      expect(validateId('abcd_1234')).toBe(false);
      expect(validateId('abcd.1234')).toBe(false);
    });

    it('should reject null, undefined, and empty strings', () => {
      expect(validateId(null)).toBe(false);
      expect(validateId(undefined)).toBe(false);
      expect(validateId('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateId(12345678)).toBe(false);
      expect(validateId({})).toBe(false);
      expect(validateId([])).toBe(false);
    });
  });

  describe('ID_PATTERN', () => {
    it('should match valid IDs', () => {
      expect('abcd1234').toMatch(ID_PATTERN);
      expect('12345678901234567890').toMatch(ID_PATTERN); // 20 chars
    });

    it('should not match invalid IDs', () => {
      expect('abc').not.toMatch(ID_PATTERN);
      expect('ABC12345').not.toMatch(ID_PATTERN);
    });
  });
});