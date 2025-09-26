// Mock for Cloudflare KV
const mockKV = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Mock context
const createMockContext = (roomId, body = {}) => ({
  request: {
    json: jest.fn().mockResolvedValue(body)
  },
  env: {
    SENRYU_KV: mockKV
  },
  params: {
    id: roomId
  }
});

// Import after mocks
const { onRequestPost } = require('../next-presenter');

describe('next-presenter API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    test('rejects request from non-presenter and non-host', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' },
          { id: 'other-player', name: 'Other' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        return Promise.resolve(null);
      });

      const context = createMockContext('test-room', {
        playerId: 'other-player' // Not host, not presenter
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toContain('ホストまたは現在のプレゼンターのみ');
    });

    test('allows request from current presenter', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(null); // No lock exists
        }
        return Promise.resolve(null);
      });

      mockKV.put.mockResolvedValue();

      const context = createMockContext('test-room', {
        playerId: 'presenter-player' // Current presenter
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.room).toBeDefined();
      expect(result.room.gameState).toBe('scoring');
    });

    test('allows request from host', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(null); // No lock exists
        }
        return Promise.resolve(null);
      });

      mockKV.put.mockResolvedValue();

      const context = createMockContext('test-room', {
        playerId: 'host-player' // Host
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.room).toBeDefined();
    });
  });

  describe('Distributed Lock', () => {
    test('prevents concurrent execution with active lock', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      // Setup: room exists and lock is already acquired
      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(`other-player:${Date.now()}`); // Recent lock
        }
        return Promise.resolve(null);
      });

      const context = createMockContext('test-room', {
        playerId: 'presenter-player'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(409); // Conflict
      expect(result.error).toContain('プレゼン終了処理が既に実行中');
      expect(mockKV.put).not.toHaveBeenCalled(); // Should not update room
    });

    test('ignores expired lock and proceeds', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      // Setup: room exists and lock is expired (older than 60 seconds)
      const expiredTimestamp = Date.now() - 61000;
      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(`other-player:${expiredTimestamp}`); // Expired lock
        }
        return Promise.resolve(null);
      });

      mockKV.put.mockResolvedValue();

      const context = createMockContext('test-room', {
        playerId: 'presenter-player'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.room).toBeDefined();
      expect(mockKV.put).toHaveBeenCalled(); // Should update room
    });
  });

  describe('State Transitions', () => {
    test('transitions from presenting to scoring', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 0,
        gameState: 'presenting',
        presentationStarted: true
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(null); // No lock
        }
        return Promise.resolve(null);
      });

      mockKV.put.mockResolvedValue();

      const context = createMockContext('test-room', {
        playerId: 'host-player'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.room.gameState).toBe('scoring');
      expect(result.room.presentationStarted).toBe(false);
      
      // Check that room was saved to KV
      expect(mockKV.put).toHaveBeenCalledWith(
        'room:test-room',
        expect.stringContaining('"gameState":"scoring"'),
        expect.objectContaining({ expirationTtl: 604800 })
      );
    });

    test('initializes score tracking for current presenter', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting',
        submittedScores: {}
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(null); // No lock
        }
        return Promise.resolve(null);
      });

      mockKV.put.mockResolvedValue();

      const context = createMockContext('test-room', {
        playerId: 'presenter-player'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.room.submittedScores['presenter-player']).toBeDefined();
      expect(result.room.submittedScores['presenter-player']).toEqual({});
    });
  });

  describe('Error Handling', () => {
    test('returns 404 when room not found', async () => {
      mockKV.get.mockResolvedValue(null);

      const context = createMockContext('non-existent-room', {
        playerId: 'player1'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toContain('部屋が見つかりません');
    });

    test('handles KV storage errors gracefully', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [{ id: 'host-player', name: 'Host' }],
        currentPresenterIndex: 0,
        gameState: 'presenting'
      };

      mockKV.get.mockImplementation((key) => {
        if (key === 'room:test-room') {
          return Promise.resolve(JSON.stringify(roomData));
        }
        if (key.startsWith('presentation-end:')) {
          return Promise.resolve(null); // No lock
        }
        return Promise.resolve(null);
      });

      // Simulate KV put failure
      mockKV.put.mockRejectedValue(new Error('KV storage error'));

      const context = createMockContext('test-room', {
        playerId: 'host-player'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toContain('次のプレゼンターへの移行に失敗');
    });

    test('handles malformed JSON in room data', async () => {
      mockKV.get.mockResolvedValue('{ invalid json }');

      const context = createMockContext('test-room', {
        playerId: 'player1'
      });

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBeDefined();
    });

    test('handles missing request body', async () => {
      const context = {
        request: {
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
        },
        env: {
          SENRYU_KV: mockKV
        },
        params: {
          id: 'test-room'
        }
      };

      const response = await onRequestPost(context);
      const result = await response.json();

      expect(response.status).toBe(500);
    });

    test('handles race condition with simultaneous requests', async () => {
      const roomData = {
        id: 'test-room',
        hostId: 'host-player',
        players: [
          { id: 'host-player', name: 'Host' },
          { id: 'presenter-player', name: 'Presenter' }
        ],
        currentPresenterIndex: 1,
        gameState: 'presenting'
      };

      const lockValue = `other-player:${Date.now()}`;
      
      // 両プレイヤーが同時にリクエスト
      mockKV.get
        .mockResolvedValueOnce(JSON.stringify(roomData)) // room data
        .mockResolvedValueOnce(lockValue); // existing lock

      const context1 = createMockContext('test-room', {
        playerId: 'presenter-player'
      });

      const response1 = await onRequestPost(context1);
      const result1 = await response1.json();

      expect(response1.status).toBe(409);
      expect(result1.error).toContain('プレゼン終了処理が既に実行中');
    });
  });
});