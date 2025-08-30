/**
 * Test helper functions for mocking OpenAI API responses
 */

/**
 * Create a mock OpenAI API response
 */
export function createMockOpenAIResponse(content: any, usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) {
  return {
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: typeof content === 'string' ? content : JSON.stringify(content),
        },
      }],
      usage: usage || {
        prompt_tokens: 500,
        completion_tokens: 300,
        total_tokens: 800,
      },
    }),
  } as Response;
}

/**
 * Create a mock OpenAI API error response
 */
export function createMockOpenAIError(message: string = 'API Error', status: number = 500) {
  return {
    ok: false,
    status,
    json: async () => ({
      error: {
        message,
        type: 'api_error',
      },
    }),
  } as Response;
}

/**
 * Mock fetch for OpenAI API calls
 */
export function mockOpenAIFetch(response: any, usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) {
  global.fetch = jest.fn().mockResolvedValue(createMockOpenAIResponse(response, usage));
  return global.fetch as jest.Mock;
}

/**
 * Mock fetch for OpenAI API errors
 */
export function mockOpenAIFetchError(message: string = 'API Error', status: number = 500) {
  global.fetch = jest.fn().mockResolvedValue(createMockOpenAIError(message, status));
  return global.fetch as jest.Mock;
}

/**
 * Mock fetch to reject (network error)
 */
export function mockOpenAIFetchReject(error: Error = new Error('Network error')) {
  global.fetch = jest.fn().mockRejectedValue(error);
  return global.fetch as jest.Mock;
}

/**
 * Create a mock diagnosis response for v4 engine
 */
export function createMockDiagnosisResponse(compatibility: number = 92) {
  return {
    type: compatibility >= 90 ? '運命のCloud Nativeパートナー' : 
          compatibility >= 80 ? 'Container Orchestrationの調和' : 
          'DevOps Journeyの同志',
    compatibility,
    summary: 'テストユーザー間の技術的な波動が共鳴しています。',
    astrologicalAnalysis: '二人のエンジニアリング・エナジーが美しく調和しています。',
    techStackCompatibility: 'お互いの技術スタックが素晴らしい相性を示しています。',
    conversationTopics: ['クラウドアーキテクチャ', 'DevOps', 'マイクロサービス'],
    strengths: ['技術力', '創造性', '協調性'],
    opportunities: ['協業の可能性', '知識共有', '共同プロジェクト'],
    advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
    luckyItem: '🎧 ノイズキャンセリングヘッドフォン',
    luckyAction: '🎯 一緒にハッカソンに参加する',
  };
}

/**
 * Setup OpenAI mocks for a test suite
 */
export class OpenAIMockSetup {
  private originalFetch: typeof global.fetch;
  private originalEnv: string | undefined;

  constructor() {
    this.originalFetch = global.fetch;
    this.originalEnv = process.env.OPENAI_API_KEY;
  }

  /**
   * Setup mocks with API key
   */
  setup(apiKey: string = 'test-api-key') {
    process.env.OPENAI_API_KEY = apiKey;
    return this;
  }

  /**
   * Mock a successful response
   */
  mockSuccess(response: any, usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) {
    mockOpenAIFetch(response, usage);
    return this;
  }

  /**
   * Mock an error response
   */
  mockError(message: string = 'API Error', status: number = 500) {
    mockOpenAIFetchError(message, status);
    return this;
  }

  /**
   * Mock a network failure
   */
  mockNetworkError(error?: Error) {
    mockOpenAIFetchReject(error);
    return this;
  }

  /**
   * Restore original state
   */
  restore() {
    global.fetch = this.originalFetch;
    if (this.originalEnv) {
      process.env.OPENAI_API_KEY = this.originalEnv;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }
}

/**
 * Verify OpenAI API was called with expected parameters
 */
export function expectOpenAICall(mockFetch: jest.Mock, expectedModel: string = 'gpt-4o-mini', expectedTemperature: number = 0.9) {
  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.openai.com/v1/chat/completions',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Authorization': expect.stringContaining('Bearer '),
      }),
      body: expect.stringContaining(`"model":"${expectedModel}"`),
    })
  );
  
  // Check temperature if provided
  if (expectedTemperature !== undefined) {
    const bodyCall = mockFetch.mock.calls[0][1].body;
    const bodyData = JSON.parse(bodyCall);
    expect(bodyData.temperature).toBe(expectedTemperature);
  }
}