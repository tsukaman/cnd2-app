/**
 * @jest-environment node
 */

import { DiagnosisCache } from '../diagnosis-cache';
import { PrairieProfile, DiagnosisResult } from '@/types';

describe('DiagnosisCache', () => {
  let cache: DiagnosisCache;

  const mockProfile1: PrairieProfile = {
    basic: {
      name: 'Test User 1',
      username: 'Engineer',
      bio: 'Bio 1',
    },
    metrics: {
      followers: 100,
      following: 50,
      tweets: 200,
      listed: 5,
    },
    details: {
      topics: ['JavaScript', 'React'],
      hashtags: ['Web Development'],
      recentTweets: [],
      mentionedUsers: [],
    },
    social: {},
    custom: {},
    meta: {},
  };

  const mockProfile2: PrairieProfile = {
    basic: {
      name: 'Test User 2',
      username: 'Designer',
      bio: 'Bio 2',
    },
    metrics: {
      followers: 200,
      following: 100,
      tweets: 300,
      listed: 10,
    },
    details: {
      topics: ['Figma', 'UI/UX'],
      hashtags: ['Design Systems'],
      recentTweets: [],
      mentionedUsers: [],
    },
    social: {},
    custom: {},
    meta: {},
  };

  const mockResult: DiagnosisResult = {
    id: 'original-id',
    mode: 'duo',
    type: 'Test Type',
    compatibility: 85,
    summary: 'Test summary',
    participants: [mockProfile1, mockProfile2],
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    cache = DiagnosisCache.getInstance();
    cache.clear();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = DiagnosisCache.getInstance();
      const instance2 = DiagnosisCache.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('get/set', () => {
    it('診断結果を保存して取得できる', () => {
      const profiles = [mockProfile1, mockProfile2];
      
      cache.set(profiles, 'duo', mockResult);
      const retrieved = cache.get(profiles, 'duo');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.summary).toBe(mockResult.summary);
      expect(retrieved?.compatibility).toBe(mockResult.compatibility);
    });

    it('キャッシュから取得時に新しいIDと時刻を生成する', () => {
      const profiles = [mockProfile1, mockProfile2];
      
      cache.set(profiles, 'duo', mockResult);
      const retrieved = cache.get(profiles, 'duo');
      
      expect(retrieved?.id).not.toBe('original-id');
      expect(retrieved?.createdAt).not.toBe('2024-01-01T00:00:00Z');
    });

    it('同じプロファイルの順序が違っても同じキャッシュを使用する', () => {
      const profiles1 = [mockProfile1, mockProfile2];
      const profiles2 = [mockProfile2, mockProfile1]; // 順序を逆に
      
      cache.set(profiles1, 'duo', mockResult);
      const retrieved = cache.get(profiles2, 'duo');
      
      // プロファイルの順序に関係なく同じ結果を取得
      expect(retrieved).toBeDefined();
      expect(retrieved?.summary).toBe(mockResult.summary);
    });

    it('異なるモードでは別のキャッシュを使用する', () => {
      const profiles = [mockProfile1, mockProfile2];
      const duoResult = { ...mockResult, mode: 'duo' as const, summary: 'Duo summary' };
      const groupResult = { ...mockResult, mode: 'group' as const, summary: 'Group summary' };
      
      cache.set(profiles, 'duo', duoResult);
      cache.set(profiles, 'group', groupResult);
      
      const duoRetrieved = cache.get(profiles, 'duo');
      const groupRetrieved = cache.get(profiles, 'group');
      
      expect(duoRetrieved?.summary).toBe('Duo summary');
      expect(groupRetrieved?.summary).toBe('Group summary');
    });
  });

  describe('キャッシュミス', () => {
    it('存在しないキーの場合nullを返す', () => {
      const profiles = [mockProfile1, mockProfile2];
      
      const result = cache.get(profiles, 'duo');
      
      expect(result).toBeNull();
    });

    it('期限切れのエントリはnullを返す', () => {
      const profiles = [mockProfile1, mockProfile2];
      
      // TTLを超えた時刻を設定するため、内部実装をモック
      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValue(0); // 保存時
      cache.set(profiles, 'duo', mockResult);
      
      nowSpy.mockReturnValue(2 * 60 * 60 * 1000 + 1); // 2時間後
      const result = cache.get(profiles, 'duo');
      
      nowSpy.mockRestore(); // モックをリストア
      expect(result).toBeNull();
    });
  });

  describe('clearForProfile', () => {
    it('特定のプロファイルを含むキャッシュをクリアする', () => {
      const profiles1 = [mockProfile1, mockProfile2];
      const profiles2 = [mockProfile1, { ...mockProfile2, basic: { ...mockProfile2.basic, name: 'Other User' } }];
      
      cache.set(profiles1, 'duo', mockResult);
      cache.set(profiles2, 'duo', mockResult);
      
      cache.clearForProfile(mockProfile1);
      
      expect(cache.get(profiles1, 'duo')).toBeNull();
      expect(cache.get(profiles2, 'duo')).toBeNull();
    });

    it('関係ないキャッシュは削除しない', () => {
      const otherProfile: PrairieProfile = {
        ...mockProfile1,
        basic: { ...mockProfile1.basic, name: 'Other User' },
      };
      
      const profiles1 = [mockProfile1, mockProfile2];
      const profiles2 = [otherProfile, mockProfile2];
      
      cache.set(profiles1, 'duo', mockResult);
      cache.set(profiles2, 'duo', mockResult);
      
      cache.clearForProfile(mockProfile1);
      
      expect(cache.get(profiles1, 'duo')).toBeNull();
      expect(cache.get(profiles2, 'duo')).toBeDefined();
    });
  });

  describe('clear', () => {
    it('全てのキャッシュをクリアする', () => {
      const profiles1 = [mockProfile1, mockProfile2];
      const profiles2 = [mockProfile2, mockProfile1];
      
      cache.set(profiles1, 'duo', mockResult);
      cache.set(profiles2, 'group', mockResult);
      
      cache.clear();
      
      expect(cache.get(profiles1, 'duo')).toBeNull();
      expect(cache.get(profiles2, 'group')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('キャッシュサイズを返す', () => {
      expect(cache.size()).toBe(0);
      
      const profiles1 = [mockProfile1, mockProfile2];
      cache.set(profiles1, 'duo', mockResult);
      expect(cache.size()).toBe(1);
      
      const profiles2 = [mockProfile2, { ...mockProfile1, basic: { ...mockProfile1.basic, name: 'New' } }];
      cache.set(profiles2, 'duo', mockResult);
      expect(cache.size()).toBe(2);
    });
  });

  describe('getStats', () => {
    it('統計情報を返す', () => {
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(60 * 60 * 1000); // 1時間
    });

    it('最古のエントリの期限を返す', () => {
      const profiles1 = [mockProfile1, mockProfile2];
      const profiles2 = [mockProfile2, mockProfile1];
      
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      cache.set(profiles1, 'duo', mockResult);
      
      jest.spyOn(Date, 'now').mockReturnValueOnce(2000);
      cache.set(profiles2, 'group', mockResult);
      
      const stats = cache.getStats();
      
      expect(stats.oldestExpiry).toBeDefined();
      expect(stats.oldestExpiry).toBeGreaterThan(0);
    });
  });

  describe('キャッシュサイズ制限', () => {
    it('最大サイズを超えた場合、古いエントリを削除する', () => {
      // MAX_SIZE = 100なので、モックでそれを超える状況を作る
      const originalMaxSize = 100;
      
      // 100個のエントリを追加
      for (let i = 0; i < originalMaxSize; i++) {
        const profile = {
          ...mockProfile1,
          basic: { ...mockProfile1.basic, name: `User${i}` },
        };
        cache.set([profile, mockProfile2], 'duo', mockResult);
      }
      
      expect(cache.size()).toBe(originalMaxSize);
      
      // 101個目を追加すると、最も古いものが削除される
      const newProfile = {
        ...mockProfile1,
        basic: { ...mockProfile1.basic, name: 'User101' },
      };
      cache.set([newProfile, mockProfile2], 'duo', mockResult);
      
      expect(cache.size()).toBe(originalMaxSize); // サイズは変わらない
    });
  });

  describe('キャッシュキーの生成', () => {
    it('同じスキルと興味を持つプロファイルは同じキーを生成する', () => {
      const profileA1 = {
        ...mockProfile1,
        basic: { ...mockProfile1.basic, name: 'Alice' },
        details: {
          ...mockProfile1.details,
          topics: ['JavaScript', 'React'],
          hashtags: ['Web'],
        },
      };
      
      const profileA2 = {
        ...mockProfile1,
        basic: { ...mockProfile1.basic, name: 'Alice' }, // 同じ名前
        details: {
          ...mockProfile1.details,
          topics: ['React', 'JavaScript'], // 順序が違う
          hashtags: ['Web'],
        },
      };
      
      cache.set([profileA1, mockProfile2], 'duo', mockResult);
      const result = cache.get([profileA2, mockProfile2], 'duo');
      
      expect(result).toBeDefined(); // 同じキャッシュがヒットする
    });

    it('異なるスキルを持つプロファイルは異なるキーを生成する', () => {
      const profileB1 = {
        ...mockProfile1,
        details: {
          ...mockProfile1.details,
          topics: ['Python', 'Django'],
        },
      };
      
      cache.set([mockProfile1, mockProfile2], 'duo', mockResult);
      const result = cache.get([profileB1, mockProfile2], 'duo');
      
      expect(result).toBeNull(); // 異なるキーなのでキャッシュミス
    });
  });
});