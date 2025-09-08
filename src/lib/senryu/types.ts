/**
 * CloudNative川柳ゲーム - 型定義
 */

import type { SenryuCard } from '@/lib/constants/senryu-cards';

// 川柳
export interface Senryu {
  upper: SenryuCard;
  middle: SenryuCard;
  lower: SenryuCard;
}

// プレイヤー
export interface Player {
  id: string;
  name: string;
  rankingPreference: {
    allowRanking: boolean;
    anonymousRanking: boolean;
  };
  senryu?: Senryu;
  scores: Score[];
  totalScore: number;
  isHost?: boolean;
  joinedAt: string;
}

// 採点
export interface Score {
  fromPlayerId: string;
  fromPlayerName: string;
  criteria: {
    humor: number;        // 面白さ (1-5)
    persuasion: number;   // 説得力 (1-5)
    creativity: number;   // 創造性 (1-5)
    relevance: number;    // 共感度 (1-5)
    presentation: number; // プレゼン力 (1-5)
  };
  total: number;          // 合計点 (5-25)
  timestamp: string;
}

// 部屋
export interface Room {
  id: string;
  code: string;           // 6文字の部屋コード
  hostId: string;
  players: Player[];
  status: RoomStatus;
  currentPresenter?: string;  // 現在のプレゼンターID
  presentationTime: number;    // 30 or 60 seconds
  round: number;
  createdAt: string;
  updatedAt: string;
}

// 部屋の状態
export type RoomStatus = 
  | 'waiting'       // 参加者待ち
  | 'ready'         // 開始準備完了
  | 'distributing'  // カード配布中
  | 'presenting'    // プレゼン中
  | 'scoring'       // 採点中
  | 'results'       // 結果発表
  | 'finished';     // ゲーム終了

// ランキングエントリー
export interface RankingEntry {
  id: string;
  senryu: Senryu;
  playerName: string;
  playerId: string;
  anonymousRanking: boolean;  // 匿名表示フラグ
  scores: {
    total: number;
    average: number;         // 平均点 (総得点 / (採点者数 × 5項目))
    details: ScoreDetail[];
  };
  scorers: string[];         // 採点者の名前リスト
  playerCount: number;        // ゲーム参加人数
  timestamp: string;
  roomId: string;
  roomCode: string;
  isPublic: boolean;         // ランキング掲載可否
}

// 採点詳細
export interface ScoreDetail {
  scorerName: string;
  scores: {
    humor: number;
    persuasion: number;
    creativity: number;
    relevance: number;
    presentation: number;
  };
}

// ゲーム結果
export interface GameResult {
  roomId: string;
  roomCode: string;
  players: Array<{
    player: Player;
    rank: number;
    totalScore: number;
    averageScore: number;
  }>;
  timestamp: string;
}

// API レスポンス
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 部屋作成リクエスト
export interface CreateRoomRequest {
  roomCode: string;
  hostName: string;
  rankingPreference: 'public' | 'anonymous' | 'none';
}

// 部屋参加リクエスト
export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
  rankingPreference: 'public' | 'anonymous' | 'none';
}

// 採点送信リクエスト
export interface SubmitScoreRequest {
  roomId: string;
  fromPlayerId: string;
  toPlayerId: string;
  scores: {
    humor: number;
    persuasion: number;
    creativity: number;
    relevance: number;
    presentation: number;
  };
}

// 部屋状態取得レスポンス
export interface RoomStatusResponse {
  room: Room;
  currentPlayer?: Player;
  isMyTurn: boolean;
  canScore: boolean;
  timeRemaining?: number;
}