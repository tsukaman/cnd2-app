// @ts-check
const { callOpenAIWithProxy, isRegionRestrictionError } = require('../openai-proxy.js');

// グローバルfetchのモック
global.fetch = jest.fn();

describe('callOpenAIWithProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('リクエストボディの検証', () => {
    test('bodyがnullの場合エラーを投げる', async () => {
      await expect(
        callOpenAIWithProxy({
          apiKey: 'test-key',
          body: null,
          env: {},
          debugLogger: null
        })
      ).rejects.toThrow('Invalid request body: missing required fields (model)');
    });

    test('modelが欠けている場合エラーを投げる', async () => {
      await expect(
        callOpenAIWithProxy({
          apiKey: 'test-key',
          body: { messages: [] },
          env: {},
          debugLogger: null
        })
      ).rejects.toThrow('Invalid request body: missing required fields (model)');
    });
  });

  describe('OpenRouterが優先して使用される', () => {
    test('OpenRouter APIキーが設定されている場合、OpenRouterを使用する', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4o-mini', messages: [] },
        env: { OPENROUTER_API_KEY: 'sk-or-v1-test' },
        debugLogger: { log: jest.fn() }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-or-v1-test'
          })
        })
      );
    });

    test('OpenRouterとAI Gatewayが両方設定されている場合、併用する', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4o-mini', messages: [] },
        env: {
          OPENROUTER_API_KEY: 'sk-or-v1-test',
          CLOUDFLARE_ACCOUNT_ID: 'account123',
          CLOUDFLARE_GATEWAY_ID: 'gateway123'
        },
        debugLogger: { log: jest.fn() }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gateway.ai.cloudflare.com/v1/account123/gateway123/openrouter/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-or-v1-test'
          })
        })
      );
    });

    test('無効なOpenRouter APIキー形式の場合、次のフォールバックを使用', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4o-mini', messages: [] },
        env: {
          OPENROUTER_API_KEY: 'invalid-key', // sk-or-v1-で始まらない
          CLOUDFLARE_ACCOUNT_ID: 'account123',
          CLOUDFLARE_GATEWAY_ID: 'gateway123'
        },
        debugLogger: { log: jest.fn() }
      });

      // Cloudflare AI Gatewayが使用される
      expect(global.fetch).toHaveBeenCalledWith(
        'https://gateway.ai.cloudflare.com/v1/account123/gateway123/openai/chat/completions',
        expect.any(Object)
      );
    });
  });

  describe('モデル名変換', () => {
    test('gpt-4o-miniがopenai/gpt-4o-miniに変換される', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4o-mini', messages: [] },
        env: { OPENROUTER_API_KEY: 'sk-or-v1-test' },
        debugLogger: null
      });

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('openai/gpt-4o-mini');
    });

    test('gpt-4がopenai/gpt-4に変換される', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4', messages: [] },
        env: { OPENROUTER_API_KEY: 'sk-or-v1-test' },
        debugLogger: null
      });

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('openai/gpt-4');
    });

    test('既にプレフィックスがある場合はそのまま使用', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'anthropic/claude-3-opus', messages: [] },
        env: { OPENROUTER_API_KEY: 'sk-or-v1-test' },
        debugLogger: null
      });

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('anthropic/claude-3-opus');
    });
  });

  describe('カスタムプロキシの検証', () => {
    test('HTTPSでないプロキシURLはエラーを投げる', async () => {
      await expect(
        callOpenAIWithProxy({
          apiKey: 'test-key',
          body: { model: 'gpt-4', messages: [] },
          env: { OPENAI_PROXY_URL: 'http://insecure-proxy.com/api' },
          debugLogger: null
        })
      ).rejects.toThrow('Custom proxy URL must use HTTPS protocol');
    });

    test('無効なURLはエラーを投げる', async () => {
      await expect(
        callOpenAIWithProxy({
          apiKey: 'test-key',
          body: { model: 'gpt-4', messages: [] },
          env: { OPENAI_PROXY_URL: 'not-a-valid-url' },
          debugLogger: null
        })
      ).rejects.toThrow('Invalid proxy URL');
    });

    test('有効なHTTPS URLは受け入れられる', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4', messages: [] },
        env: { OPENAI_PROXY_URL: 'https://secure-proxy.com/api' },
        debugLogger: { log: jest.fn() }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://secure-proxy.com/api',
        expect.any(Object)
      );
    });
  });

  describe('フォールバック戦略', () => {
    test('優先順位に従ってプロキシが選択される', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      // OpenRouterが最優先
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4', messages: [] },
        env: {
          OPENROUTER_API_KEY: 'sk-or-v1-test',
          CLOUDFLARE_ACCOUNT_ID: 'account',
          CLOUDFLARE_GATEWAY_ID: 'gateway',
          OPENAI_PROXY_URL: 'https://proxy.com/api'
        },
        debugLogger: { log: jest.fn() }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gateway.ai.cloudflare.com'),
        expect.any(Object)
      );
    });

    test('環境変数がない場合は直接OpenAI APIを呼び出す', async () => {
      global.fetch.mockResolvedValue(new Response('{}'));
      
      await callOpenAIWithProxy({
        apiKey: 'test-key',
        body: { model: 'gpt-4', messages: [] },
        env: {},
        debugLogger: { log: jest.fn() }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      );
    });
  });
});

describe('isRegionRestrictionError', () => {
  test('403ステータスコードを地域制限エラーとして検出', () => {
    const response = { status: 403 };
    expect(isRegionRestrictionError(response, {})).toBe(true);
  });

  test('エラーメッセージに"country"が含まれる場合に検出', () => {
    const error = {
      error: {
        message: 'Country, region, or territory not supported'
      }
    };
    expect(isRegionRestrictionError({ status: 400 }, error)).toBe(true);
  });

  test('エラーメッセージに"region"が含まれる場合に検出', () => {
    const error = {
      message: 'This region is not supported'
    };
    expect(isRegionRestrictionError({ status: 400 }, error)).toBe(true);
  });

  test('エラーメッセージに"territory"が含まれる場合に検出', () => {
    const error = {
      error: {
        message: 'Territory access denied'
      }
    };
    expect(isRegionRestrictionError({ status: 400 }, error)).toBe(true);
  });

  test('関係ないエラーは検出しない', () => {
    const error = {
      message: 'Invalid API key'
    };
    expect(isRegionRestrictionError({ status: 401 }, error)).toBe(false);
  });
});