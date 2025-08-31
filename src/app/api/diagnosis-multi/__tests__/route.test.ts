import { NextRequest } from 'next/server';
import { POST } from '../route';
import { unifiedDiagnosisEngine } from '@/lib/diagnosis-engine-unified';
import { sanitizer } from '@/lib/sanitizer';

// Mock dependencies
jest.mock('@/lib/diagnosis-engine-unified');
jest.mock('@/lib/sanitizer');
jest.mock('@/lib/api-middleware', () => ({
  withApiMiddleware: (handler: Function) => handler,
}));

describe('Multi-Style Diagnosis API', () => {
  const mockProfiles = [
    {
      basic: {
        name: 'Test User 1',
        title: 'Developer',
        company: 'Test Co',
        bio: 'Test bio 1'
      },
      details: {
        skills: ['React', 'TypeScript'],
        interests: ['Cloud'],
        achievements: []
      },
      social: {},
      meta: {
        sourceUrl: 'https://test.com',
        extractedAt: '2024-01-01T00:00:00Z'
      }
    },
    {
      basic: {
        name: 'Test User 2',
        title: 'Designer',
        company: 'Design Co',
        bio: 'Test bio 2'
      },
      details: {
        skills: ['Figma', 'CSS'],
        interests: ['UX'],
        achievements: []
      },
      social: {},
      meta: {
        sourceUrl: 'https://test2.com',
        extractedAt: '2024-01-01T00:00:00Z'
      }
    }
  ];

  const mockDiagnosisResult = {
    id: 'test-id',
    mode: 'duo' as const,
    type: 'test',
    compatibility: 85,
    summary: 'Great match!',
    strengths: ['Complementary skills'],
    opportunities: ['Learn from each other'],
    advice: 'Work together on projects',
    participants: mockProfiles,
    createdAt: '2024-01-01T00:00:00Z',
    aiPowered: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (sanitizer.sanitizeHTML as jest.Mock).mockImplementation((text) => text);
    (unifiedDiagnosisEngine.generateDuoDiagnosis as jest.Mock).mockResolvedValue(mockDiagnosisResult);
  });

  describe('Parallel Diagnosis Execution', () => {
    it('should handle parallel diagnosis execution for multiple styles', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['creative', 'astrological', 'fortune', 'technical']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify parallel execution
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledTimes(4);
      
      // Verify each style was called with correct options
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ style: 'creative' })
      );
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ style: 'astrological' })
      );
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ style: 'fortune', enableFortuneTelling: true })
      );
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ style: 'technical' })
      );

      // Verify response structure
      expect(data.multiResults).toHaveLength(4);
      expect(data.summary).toBeDefined();
      expect(data.metadata).toMatchObject({
        stylesRequested: ['creative', 'astrological', 'fortune', 'technical'],
        mode: 'duo'
      });
    });

    it('should handle partial style selection', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['creative', 'technical']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledTimes(2);
      expect(data.multiResults).toHaveLength(2);
      expect(data.metadata.stylesRequested).toEqual(['creative', 'technical']);
    });
  });

  describe('Style Validation', () => {
    it('should validate selected styles properly', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['invalid', 'creative', 'also-invalid']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should only process valid styles
      expect(unifiedDiagnosisEngine.generateDuoDiagnosis).toHaveBeenCalledTimes(1);
      expect(data.metadata.stylesRequested).toEqual(['creative']);
    });

    it('should return error when no valid styles provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['invalid1', 'invalid2']
        }),
      });

      await expect(POST(request)).rejects.toThrow('At least one valid style is required');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize input data correctly', async () => {
      const maliciousProfiles = [
        {
          basic: {
            name: '<script>alert("XSS")</script>',
            title: '<img src=x onerror=alert(1)>',
            company: 'Test Co',
            bio: '<div onclick="alert(1)">Bio</div>'
          },
          details: {
            skills: ['<script>evil</script>'],
            interests: [],
            achievements: []
          },
          social: {},
          meta: {
            sourceUrl: 'https://test.com',
            extractedAt: '2024-01-01T00:00:00Z'
          }
        },
        mockProfiles[1]
      ];

      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: maliciousProfiles,
          mode: 'duo',
          styles: ['creative']
        }),
      });

      await POST(request);

      // Verify sanitization was called for all text fields
      expect(sanitizer.sanitizeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
      expect(sanitizer.sanitizeHTML).toHaveBeenCalledWith('<img src=x onerror=alert(1)>');
      expect(sanitizer.sanitizeHTML).toHaveBeenCalledWith('<div onclick="alert(1)">Bio</div>');
      expect(sanitizer.sanitizeHTML).toHaveBeenCalledTimes(8); // All profile fields
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (unifiedDiagnosisEngine.generateDuoDiagnosis as jest.Mock).mockRejectedValue(
        new Error('AI service unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['creative']
        }),
      });

      await expect(POST(request)).rejects.toThrow('Failed to generate multi-style diagnosis');
    });

    it('should validate required profiles', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'duo',
          styles: ['creative']
        }),
      });

      await expect(POST(request)).rejects.toThrow('Profiles array is required');
    });

    it('should validate profile count for duo mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: [mockProfiles[0]], // Only one profile
          mode: 'duo',
          styles: ['creative']
        }),
      });

      await expect(POST(request)).rejects.toThrow('Duo mode requires exactly 2 profiles');
    });
  });

  describe('Summary Generation', () => {
    it('should generate correct summary with best style identification', async () => {
      // Mock different scores for different styles
      const mockResults = {
        creative: { ...mockDiagnosisResult, compatibility: 85 },
        technical: { ...mockDiagnosisResult, compatibility: 92 },
      };

      (unifiedDiagnosisEngine.generateDuoDiagnosis as jest.Mock)
        .mockImplementation(async (p1, p2, options) => {
          return options.style === 'technical' 
            ? mockResults.technical 
            : mockResults.creative;
        });

      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['creative', 'technical']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.bestStyle).toBe('technical');
      expect(data.summary.bestScore).toBe(92);
      expect(data.summary.averageScore).toBe(89); // (85 + 92) / 2 = 88.5, rounded to 89
    });
  });

  describe('Performance Metrics', () => {
    it('should include processing time in metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis-multi', {
        method: 'POST',
        body: JSON.stringify({
          profiles: mockProfiles,
          mode: 'duo',
          styles: ['creative', 'technical']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata.processingTimeMs).toBeDefined();
      expect(typeof data.metadata.processingTimeMs).toBe('number');
      expect(data.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});