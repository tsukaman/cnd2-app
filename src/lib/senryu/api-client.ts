// API client for Senryu game

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8788/api/senryu'
  : '/api/senryu';

export interface CreateRoomRequest {
  hostName: string;
  rankingPreference: {
    allowRanking: boolean;
    anonymousRanking: boolean;
  };
}

export interface CreateRoomResponse {
  room: any; // Room type from types.ts
  playerId: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
  rankingPreference: {
    allowRanking: boolean;
    anonymousRanking: boolean;
  };
}

export interface JoinRoomResponse {
  room: any;
  playerId: string;
}

export interface StartGameRequest {
  playerId: string;
  gameConfig?: {
    presentationTimeLimit?: number;
    numberOfSets?: number;
    redrawLimits?: {
      upper?: number;
      middle?: number;
      lower?: number;
    };
  };
}

export interface SubmitScoreRequest {
  playerId: string;
  targetPlayerId: string;
  scores: Record<string, number>;
}

export interface NextPresenterRequest {
  playerId: string;
}

class SenryuApiClient {
  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    const response = await fetch(`${API_BASE}/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create room');
    }
    
    return response.json();
  }
  
  async joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
    const response = await fetch(`${API_BASE}/room/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join room');
    }
    
    return response.json();
  }
  
  async startGame(roomId: string, request: StartGameRequest): Promise<{ room: any }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start game');
    }
    
    return response.json();
  }
  
  async submitScore(roomId: string, request: SubmitScoreRequest): Promise<{ room: any; allScoresSubmitted: boolean }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit score');
    }
    
    return response.json();
  }
  
  async nextPresenter(roomId: string, request: NextPresenterRequest): Promise<{ room: any }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/next-presenter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to move to next presenter');
    }
    
    return response.json();
  }
  
  async getRoomStatus(roomId: string): Promise<{ room: any }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get room status');
    }
    
    return response.json();
  }
  
  async transitionGameState(roomId: string, request: { playerId: string; nextState: string }): Promise<{ room: any }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transition game state');
    }
    
    return response.json();
  }
  
  async redrawCard(roomId: string, request: { playerId: string; cardType: 'upper' | 'middle' | 'lower' }): Promise<{ room: any; newCard: any; remainingRedraws: number }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/redraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to redraw card');
    }
    
    return response.json();
  }
  
  async getRankings(category: string = 'all', limit: number = 50, offset: number = 0): Promise<{
    rankings: any[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const params = new URLSearchParams({
      category,
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const response = await fetch(`${API_BASE}/ranking?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get rankings');
    }
    
    return response.json();
  }
  
  async deleteRanking(rankingId: string, adminKey: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/ranking`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rankingId, adminKey })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete ranking');
    }
    
    return response.json();
  }
  
  async startPresentation(roomId: string, request: { playerId: string }): Promise<{ room: any }> {
    const response = await fetch(`${API_BASE}/room/${roomId}/presentation-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start presentation');
    }
    
    return response.json();
  }
  
  // ギャラリー関連API（新機能）
  async publishToGallery(roomId: string, playerId: string, preference: any): Promise<{ success: boolean; entryId?: string; message: string }> {
    const response = await fetch(`${API_BASE}/gallery/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, playerId, preference })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to publish to gallery');
    }
    
    return response.json();
  }
  
  async getGalleryList(params?: {
    sort?: 'latest' | 'popular' | 'random';
    dateFrom?: string;
    dateTo?: string;
    playerCountMin?: number;
    playerCountMax?: number;
    offset?: number;
    limit?: number;
  }): Promise<{ entries: any[]; total: number; hasMore: boolean }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${API_BASE}/gallery/list?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch gallery');
    }
    
    return response.json();
  }
  
  async likeGalleryEntry(entryId: string, sessionId: string): Promise<{ likes: number; liked: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/gallery/${entryId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like entry');
    }
    
    return response.json();
  }
  
  async unlikeGalleryEntry(entryId: string, sessionId: string): Promise<{ likes: number; liked: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/gallery/${entryId}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlike entry');
    }
    
    return response.json();
  }
}

export const senryuApi = new SenryuApiClient();