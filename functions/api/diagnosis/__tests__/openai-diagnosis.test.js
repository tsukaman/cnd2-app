/**
 * Tests for OpenAI Diagnosis Implementation
 */

describe('OpenAI Diagnosis Functions', () => {
  let diagnosisModule;
  
  beforeEach(() => {
    jest.resetModules();
    diagnosisModule = require('../openai-diagnosis');
  });

  describe('generateOpenAIDiagnosis', () => {
    it('should return error object when API key is not configured', async () => {
      const env = {
        OPENAI_API_KEY: undefined
      };
      
      const result = await diagnosisModule.generateOpenAIDiagnosis(
        [{}, {}], 
        'duo', 
        env
      );
      
      expect(result).toHaveProperty('error', 'API_KEY_MISSING');
      expect(result).toHaveProperty('fallback', true);
    });

    it('should return error object when API key is placeholder', async () => {
      const env = {
        OPENAI_API_KEY: 'your-openai-api-key-here'
      };
      
      const result = await diagnosisModule.generateOpenAIDiagnosis(
        [{}, {}], 
        'duo', 
        env
      );
      
      expect(result).toHaveProperty('error', 'API_KEY_MISSING');
      expect(result).toHaveProperty('fallback', true);
    });

    it('should sanitize profiles before sending to OpenAI', async () => {
      const profiles = [
        {
          basic: {
            name: 'John Doe',
            email: 'john@example.com',
            twitter: '@johndoe',
            avatar: 'http://avatar.url',
            tags: ['JavaScript', 'React'],
            company: 'Example Corp'
          },
          interests: {
            skills: ['Docker', 'Kubernetes']
          }
        },
        {
          basic: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            tags: ['Python', 'AI']
          }
        }
      ];

      const env = {
        OPENAI_API_KEY: 'test-api-key'
      };

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                type: 'Test Type',
                compatibility: 85,
                summary: 'Test summary',
                strengths: ['Test strength'],
                opportunities: ['Test opportunity'],
                advice: 'Test advice'
              })
            }
          }]
        })
      });

      const result = await diagnosisModule.generateOpenAIDiagnosis(
        profiles, 
        'duo', 
        env
      );

      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalled();
      
      // Check that sensitive data was not sent
      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const promptContent = requestBody.messages[1].content;
      
      // Verify PII is not in the prompt
      expect(promptContent).not.toContain('John Doe');
      expect(promptContent).not.toContain('Jane Smith');
      expect(promptContent).not.toContain('john@example.com');
      expect(promptContent).not.toContain('jane@example.com');
      expect(promptContent).not.toContain('@johndoe');
      expect(promptContent).not.toContain('http://avatar.url');
      
      // Verify tags are included
      expect(promptContent).toContain('JavaScript');
      expect(promptContent).toContain('React');
      expect(promptContent).toContain('Python');
      
      // resultがnullでないことを先に確認
      expect(result).not.toBeNull();
      expect(result?.aiPowered).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      const env = {
        OPENAI_API_KEY: 'test-api-key'
      };

      // Mock fetch with error response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await diagnosisModule.generateOpenAIDiagnosis(
        [{}, {}], 
        'duo', 
        env
      );

      expect(result).toHaveProperty('error', 'NETWORK_ERROR');
      expect(result).toHaveProperty('statusCode', 500);
    });

    it('should handle JSON parsing errors', async () => {
      const env = {
        OPENAI_API_KEY: 'test-api-key'
      };

      // Mock fetch with invalid JSON response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Invalid JSON {not valid}'
            }
          }]
        })
      });

      const result = await diagnosisModule.generateOpenAIDiagnosis(
        [{}, {}], 
        'duo', 
        env
      );

      expect(result).toBeNull();
    });

    it('should handle empty OpenAI response', async () => {
      const env = {
        OPENAI_API_KEY: 'test-api-key'
      };

      // Mock fetch with empty content
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: null
            }
          }]
        })
      });

      const result = await diagnosisModule.generateOpenAIDiagnosis(
        [{}, {}], 
        'duo', 
        env
      );

      expect(result).toBeNull();
    });
  });

  describe('generateFallbackDiagnosis', () => {
    it('should generate fallback diagnosis for duo mode', () => {
      const profiles = [
        {
          basic: {
            tags: ['JavaScript', 'React']
          },
          interests: {
            skills: ['Docker']
          }
        },
        {
          basic: {
            tags: ['Python', 'React']
          }
        }
      ];

      const result = diagnosisModule.generateFallbackDiagnosis(profiles, 'duo');

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('compatibility');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('advice');
      expect(result.aiPowered).toBe(false);
      
      // Check compatibility is in expected range
      expect(result.compatibility).toBeGreaterThanOrEqual(70);
      expect(result.compatibility).toBeLessThanOrEqual(100);
    });

    it('should handle profiles without tags or interests', () => {
      const profiles = [
        {},
        {}
      ];

      const result = diagnosisModule.generateFallbackDiagnosis(profiles, 'duo');

      expect(result).toHaveProperty('type');
      expect(result.aiPowered).toBe(false);
    });

    it('should work for group mode', () => {
      const profiles = [
        { basic: { tags: ['Go'] } },
        { basic: { tags: ['Rust'] } },
        { basic: { tags: ['C++'] } }
      ];

      const result = diagnosisModule.generateFallbackDiagnosis(profiles, 'group');

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('compatibility');
      expect(result.aiPowered).toBe(false);
    });
  });
});