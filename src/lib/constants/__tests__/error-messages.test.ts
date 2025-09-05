import {
  ERROR_CODES,
  ERROR_MESSAGES_JA,
  ERROR_MESSAGES_EN,
  ERROR_STATUS_CODES,
  getErrorMessage,
  getErrorStatusCode,
  ErrorCode,
} from '../error-messages';

describe('Error Messages System', () => {
  describe('ERROR_CODES', () => {
    it('すべてのエラーコードが一意である', () => {
      const values = Object.values(ERROR_CODES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('エラーコードが適切な命名規則に従っている', () => {
      const codePattern = /^[A-Z]+_[A-Z_]+$/;
      Object.values(ERROR_CODES).forEach(code => {
        expect(code).toMatch(codePattern);
      });
    });

    it('エラーコードがカテゴリごとに整理されている', () => {
      // Common errors
      expect(ERROR_CODES.INVALID_REQUEST).toContain('COMMON_');
      expect(ERROR_CODES.INTERNAL_ERROR).toContain('COMMON_');
      
      // Prairie Card errors
      expect(ERROR_CODES.PRAIRIE_URL_REQUIRED).toContain('PRAIRIE_');
      expect(ERROR_CODES.PRAIRIE_INVALID_URL).toContain('PRAIRIE_');
      
      // Diagnosis errors
      expect(ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED).toContain('DIAGNOSIS_');
      expect(ERROR_CODES.DIAGNOSIS_MIN_PROFILES).toContain('DIAGNOSIS_');
      
      // Storage errors
      expect(ERROR_CODES.STORAGE_SAVE_FAILED).toContain('STORAGE_');
      expect(ERROR_CODES.STORAGE_KV_UNAVAILABLE).toContain('STORAGE_');
      
      // Result errors
      expect(ERROR_CODES.RESULT_NOT_FOUND).toContain('RESULT_');
      expect(ERROR_CODES.RESULT_INVALID_ID).toContain('RESULT_');
    });
  });

  describe('Error Messages Internationalization', () => {
    it('すべてのエラーコードに日本語メッセージが定義されている', () => {
      Object.values(ERROR_CODES).forEach(code => {
        const message = ERROR_MESSAGES_JA[code as ErrorCode];
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('すべてのエラーコードに英語メッセージが定義されている', () => {
      Object.values(ERROR_CODES).forEach(code => {
        const message = ERROR_MESSAGES_EN[code as ErrorCode];
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('日本語と英語のメッセージが同じエラーコードセットを持つ', () => {
      const jaKeys = Object.keys(ERROR_MESSAGES_JA);
      const enKeys = Object.keys(ERROR_MESSAGES_EN);
      
      expect(jaKeys.sort()).toEqual(enKeys.sort());
    });
  });

  describe('Status Code Mappings', () => {
    it('すべてのエラーコードにステータスコードがマッピングされている', () => {
      Object.values(ERROR_CODES).forEach(code => {
        const statusCode = ERROR_STATUS_CODES[code as ErrorCode];
        expect(statusCode).toBeDefined();
        expect(typeof statusCode).toBe('number');
        expect(statusCode).toBeGreaterThanOrEqual(400);
        expect(statusCode).toBeLessThan(600);
      });
    });

    it('適切なHTTPステータスコードカテゴリにマッピングされている', () => {
      // 400 Bad Request
      expect(ERROR_STATUS_CODES[ERROR_CODES.INVALID_REQUEST]).toBe(400);
      expect(ERROR_STATUS_CODES[ERROR_CODES.VALIDATION_ERROR]).toBe(400);
      
      // 401 Unauthorized
      expect(ERROR_STATUS_CODES[ERROR_CODES.UNAUTHORIZED]).toBe(401);
      
      // 404 Not Found
      expect(ERROR_STATUS_CODES[ERROR_CODES.NOT_FOUND]).toBe(404);
      expect(ERROR_STATUS_CODES[ERROR_CODES.PRAIRIE_NOT_FOUND]).toBe(404);
      expect(ERROR_STATUS_CODES[ERROR_CODES.RESULT_NOT_FOUND]).toBe(404);
      
      // 429 Too Many Requests
      expect(ERROR_STATUS_CODES[ERROR_CODES.RATE_LIMIT_EXCEEDED]).toBe(429);
      
      // 500 Internal Server Error
      expect(ERROR_STATUS_CODES[ERROR_CODES.INTERNAL_ERROR]).toBe(500);
      expect(ERROR_STATUS_CODES[ERROR_CODES.DIAGNOSIS_GENERATION_FAILED]).toBe(500);
      
      // 503 Service Unavailable
      expect(ERROR_STATUS_CODES[ERROR_CODES.STORAGE_KV_UNAVAILABLE]).toBe(503);
    });
  });

  describe('getErrorMessage', () => {
    it('日本語メッセージを正しく取得する', () => {
      const message = getErrorMessage(ERROR_CODES.INVALID_REQUEST, 'ja');
      expect(message).toBe('不正なリクエストです');
    });

    it('英語メッセージを正しく取得する', () => {
      const message = getErrorMessage(ERROR_CODES.INVALID_REQUEST, 'en');
      expect(message).toBe('Invalid request');
    });

    it('デフォルトで日本語メッセージを返す', () => {
      const message = getErrorMessage(ERROR_CODES.INVALID_REQUEST);
      expect(message).toBe('不正なリクエストです');
    });

    it('未定義のエラーコードに対してデフォルトメッセージを返す', () => {
      const message = getErrorMessage('UNKNOWN_CODE' as ErrorCode);
      expect(message).toBe(ERROR_MESSAGES_JA[ERROR_CODES.INTERNAL_ERROR]);
    });
  });

  describe('getErrorStatusCode', () => {
    it('正しいステータスコードを返す', () => {
      expect(getErrorStatusCode(ERROR_CODES.INVALID_REQUEST)).toBe(400);
      expect(getErrorStatusCode(ERROR_CODES.UNAUTHORIZED)).toBe(401);
      expect(getErrorStatusCode(ERROR_CODES.NOT_FOUND)).toBe(404);
      expect(getErrorStatusCode(ERROR_CODES.INTERNAL_ERROR)).toBe(500);
    });

    it('未定義のエラーコードに対してデフォルトステータスコード500を返す', () => {
      const statusCode = getErrorStatusCode('UNKNOWN_CODE' as ErrorCode);
      expect(statusCode).toBe(500);
    });
  });

  describe('Error Code Consistency', () => {
    it('Prairie Card関連エラーが一貫している', () => {
      const prairieErrors = Object.entries(ERROR_CODES)
        .filter(([_, code]) => code.startsWith('PRAIRIE_'));
      
      expect(prairieErrors.length).toBeGreaterThan(0);
      
      // URLエラーが定義されている
      expect(prairieErrors.some(([_, code]) => code.includes('URL'))).toBe(true);
      // フェッチエラーが定義されている
      expect(prairieErrors.some(([_, code]) => code.includes('FETCH'))).toBe(true);
      // パースエラーが定義されている
      expect(prairieErrors.some(([_, code]) => code.includes('PARSE'))).toBe(true);
    });

    it('診断関連エラーが一貫している', () => {
      const diagnosisErrors = Object.entries(ERROR_CODES)
        .filter(([_, code]) => code.startsWith('DIAGNOSIS_'));
      
      expect(diagnosisErrors.length).toBeGreaterThan(0);
      
      // プロフィール関連エラーが定義されている
      expect(diagnosisErrors.some(([_, code]) => code.includes('PROFILE'))).toBe(true);
      // AIエラーが定義されている
      expect(diagnosisErrors.some(([_, code]) => code.includes('AI'))).toBe(true);
    });

    it('ストレージ関連エラーが一貫している', () => {
      const storageErrors = Object.entries(ERROR_CODES)
        .filter(([_, code]) => code.startsWith('STORAGE_'));
      
      expect(storageErrors.length).toBeGreaterThan(0);
      
      // 保存/読み込みエラーが定義されている
      expect(storageErrors.some(([_, code]) => code.includes('SAVE'))).toBe(true);
      expect(storageErrors.some(([_, code]) => code.includes('LOAD'))).toBe(true);
      // KV関連エラーが定義されている
      expect(storageErrors.some(([_, code]) => code.includes('KV'))).toBe(true);
    });
  });
});