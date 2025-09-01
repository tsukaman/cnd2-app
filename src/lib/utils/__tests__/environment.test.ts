import { 
  isDevelopment, 
  isProduction, 
  isTest,
  getEnvVar,
  getEnvBoolean,
  getEnvNumber,
  validateRequiredEnvVars,
  logEnvironment
} from '../environment';

describe('環境判定ユーティリティ', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isDevelopment', () => {
    it('NODE_ENV=developmentの場合trueを返す', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('ENVIRONMENT=developmentの場合trueを返す（Cloudflare対応）', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENVIRONMENT = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('どちらもdevelopmentでない場合falseを返す', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENVIRONMENT = 'production';
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('NODE_ENV=productionかつENVIRONMENT!=developmentの場合trueを返す', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENVIRONMENT = 'production';
      expect(isProduction()).toBe(true);
    });

    it('NODE_ENV=productionでもENVIRONMENT=developmentの場合falseを返す', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENVIRONMENT = 'development';
      expect(isProduction()).toBe(false);
    });

    it('NODE_ENV!=productionの場合falseを返す', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });
  });

  describe('isTest', () => {
    it('NODE_ENV=testの場合trueを返す', () => {
      process.env.NODE_ENV = 'test';
      expect(isTest()).toBe(true);
    });

    it('NODE_ENV!=testの場合falseを返す', () => {
      process.env.NODE_ENV = 'development';
      expect(isTest()).toBe(false);
    });
  });

  describe('getEnvVar', () => {
    it('環境変数が設定されている場合その値を返す', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getEnvVar('TEST_VAR')).toBe('test_value');
    });

    it('環境変数が設定されていない場合デフォルト値を返す', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR', 'default')).toBe('default');
    });

    it('環境変数が設定されていない場合かつデフォルト値なしの場合undefinedを返す', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR')).toBeUndefined();
    });
  });

  describe('getEnvBoolean', () => {
    it('"true"文字列の場合trueを返す', () => {
      process.env.TEST_BOOL = 'true';
      expect(getEnvBoolean('TEST_BOOL')).toBe(true);
    });

    it('"TRUE"文字列の場合trueを返す（大文字小文字を区別しない）', () => {
      process.env.TEST_BOOL = 'TRUE';
      expect(getEnvBoolean('TEST_BOOL')).toBe(true);
    });

    it('"1"文字列の場合trueを返す', () => {
      process.env.TEST_BOOL = '1';
      expect(getEnvBoolean('TEST_BOOL')).toBe(true);
    });

    it('"false"文字列の場合falseを返す', () => {
      process.env.TEST_BOOL = 'false';
      expect(getEnvBoolean('TEST_BOOL')).toBe(false);
    });

    it('環境変数が設定されていない場合デフォルト値を返す', () => {
      delete process.env.TEST_BOOL;
      expect(getEnvBoolean('TEST_BOOL', true)).toBe(true);
      expect(getEnvBoolean('TEST_BOOL', false)).toBe(false);
    });
  });

  describe('getEnvNumber', () => {
    it('有効な数値文字列の場合数値を返す', () => {
      process.env.TEST_NUM = '42';
      expect(getEnvNumber('TEST_NUM', 0)).toBe(42);
    });

    it('負の数値文字列の場合も正しく処理する', () => {
      process.env.TEST_NUM = '-10';
      expect(getEnvNumber('TEST_NUM', 0)).toBe(-10);
    });

    it('無効な数値文字列の場合デフォルト値を返す', () => {
      process.env.TEST_NUM = 'not_a_number';
      expect(getEnvNumber('TEST_NUM', 100)).toBe(100);
    });

    it('環境変数が設定されていない場合デフォルト値を返す', () => {
      delete process.env.TEST_NUM;
      expect(getEnvNumber('TEST_NUM', 50)).toBe(50);
    });
  });

  describe('validateRequiredEnvVars', () => {
    it('すべての必須環境変数が設定されている場合エラーを投げない', () => {
      process.env.REQUIRED1 = 'value1';
      process.env.REQUIRED2 = 'value2';
      
      expect(() => {
        validateRequiredEnvVars(['REQUIRED1', 'REQUIRED2']);
      }).not.toThrow();
    });

    it('必須環境変数が欠けている場合エラーを投げる', () => {
      process.env.REQUIRED1 = 'value1';
      delete process.env.REQUIRED2;
      delete process.env.REQUIRED3;
      
      expect(() => {
        validateRequiredEnvVars(['REQUIRED1', 'REQUIRED2', 'REQUIRED3']);
      }).toThrow('Missing required environment variables: REQUIRED2, REQUIRED3');
    });

    it('空の配列の場合エラーを投げない', () => {
      expect(() => {
        validateRequiredEnvVars([]);
      }).not.toThrow();
    });
  });

  describe('logEnvironment', () => {
    const originalLog = console.log;
    let logSpy: jest.Mock;

    beforeEach(() => {
      logSpy = jest.fn();
      console.log = logSpy;
    });

    afterEach(() => {
      console.log = originalLog;
    });

    it('開発環境の場合環境情報をログ出力する', () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_FALLBACK = 'true';
      
      logEnvironment();
      
      expect(logSpy).toHaveBeenCalledWith('[Environment]', expect.objectContaining({
        NODE_ENV: 'development',
        ENABLE_FALLBACK: 'true',
        isDevelopment: true,
        isProduction: false,
        isTest: false
      }));
    });

    it('DEBUG_MODE=trueの場合も環境情報をログ出力する', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG_MODE = 'true';
      
      logEnvironment();
      
      expect(logSpy).toHaveBeenCalled();
    });

    it('本番環境かつDEBUG_MODE!=trueの場合ログ出力しない', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG_MODE = 'false';
      
      logEnvironment();
      
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});