import { TIME, KV_TTL, METRICS_KEYS, safeParseInt } from '../constants.js';

describe('Constants', () => {
  describe('TIME constants', () => {
    it('should have correct time values in seconds', () => {
      expect(TIME.ONE_MINUTE).toBe(60);
      expect(TIME.ONE_HOUR).toBe(3600);
      expect(TIME.ONE_DAY).toBe(86400);
      expect(TIME.SEVEN_DAYS).toBe(604800);
      expect(TIME.THIRTY_DAYS).toBe(2592000);
    });
  });

  describe('KV_TTL constants', () => {
    it('should use TIME constants correctly', () => {
      expect(KV_TTL.DIAGNOSIS).toBe(TIME.SEVEN_DAYS);
      expect(KV_TTL.METRICS).toBe(TIME.THIRTY_DAYS);
      expect(KV_TTL.CACHE).toBe(TIME.ONE_HOUR);
    });
  });

  describe('METRICS_KEYS', () => {
    it('should have consistent key format', () => {
      expect(METRICS_KEYS.PRAIRIE_SUCCESS).toBe('metrics:prairie:success');
      expect(METRICS_KEYS.PRAIRIE_ERROR).toBe('metrics:prairie:error');
      expect(METRICS_KEYS.DIAGNOSIS_SUCCESS).toBe('metrics:diagnosis:success');
      expect(METRICS_KEYS.DIAGNOSIS_ERROR).toBe('metrics:diagnosis:error');
      expect(METRICS_KEYS.CACHE_HIT).toBe('metrics:cache:hit');
      expect(METRICS_KEYS.CACHE_MISS).toBe('metrics:cache:miss');
    });
  });

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-456')).toBe(-456);
    });

    it('should return default for null/undefined', () => {
      expect(safeParseInt(null)).toBe(0);
      expect(safeParseInt(undefined)).toBe(0);
      expect(safeParseInt(null, 100)).toBe(100);
      expect(safeParseInt(undefined, -1)).toBe(-1);
    });

    it('should return default for empty string', () => {
      expect(safeParseInt('')).toBe(0);
      expect(safeParseInt('', 50)).toBe(50);
    });

    it('should return default for invalid numbers', () => {
      expect(safeParseInt('abc')).toBe(0);
      expect(safeParseInt('12.34')).toBe(12); // parseInt behavior
      expect(safeParseInt('not a number', 999)).toBe(999);
    });

    it('should handle edge cases', () => {
      expect(safeParseInt('0x10')).toBe(0); // Doesn't parse hex
      expect(safeParseInt('10px')).toBe(10); // Stops at non-digit
      expect(safeParseInt('  42  ')).toBe(42); // Trims whitespace
    });
  });
});