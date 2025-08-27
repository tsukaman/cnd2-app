import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GroupPage from '../page';
import { useRouter } from 'next/navigation';

// Next.js navigationモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    getAll: jest.fn((key) => {
      if (key === 'participant') {
        return [
          'https://prairie.cards/user1',
          'https://prairie.cards/user2',
          'https://prairie.cards/user3',
        ];
      }
      return [];
    }),
  })),
}));

// API clientモック
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    prairie: {
      fetch: jest.fn(),
    },
    diagnosis: {
      generate: jest.fn(),
    },
  },
}));

// コンポーネントモック
jest.mock('@/components/ProfileSelector', () => ({
  ProfileSelector: ({ onScan, index }: any) => (
    <div data-testid={`profile-selector-${index}`}>
      <button onClick={() => onScan('https://prairie.cards/test')}>
        スキャン
      </button>
    </div>
  ),
}));

jest.mock('@/components/diagnosis/DiagnosisResult', () => ({
  DiagnosisResult: ({ result }: any) => (
    <div data-testid="diagnosis-result">
      {result.mode} - {result.compatibility}% - {result.summary}
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingScreen', () => ({
  LoadingScreen: ({ message }: any) => (
    <div data-testid="loading-screen">{message}</div>
  ),
}));

import { apiClient } from '@/lib/api-client';

describe('GroupPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  const createMockProfile = (name: string) => ({
    basic: {
      name,
      title: `${name} Title`,
      company: `${name} Company`,
      bio: `${name} Bio`,
    },
    details: {
      tags: [],
      skills: [`${name}-skill`],
      interests: [`${name}-interest`],
      certifications: [],
      communities: [],
    },
    social: {},
    custom: {},
    meta: {},
  });

  const mockProfiles = [
    createMockProfile('User1'),
    createMockProfile('User2'),
    createMockProfile('User3'),
  ];

  const mockDiagnosisResult = {
    id: 'group-test-123',
    mode: 'group',
    type: 'クラウドネイティブ・チーム型',
    compatibility: 75,
    summary: 'グループ診断結果',
    strengths: ['チーム強み1', 'チーム強み2'],
    opportunities: ['機会1', '機会2'],
    advice: 'チームアドバイス',
    participants: mockProfiles,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('レンダリング', () => {
    it('初期状態で3人分のプロファイルセレクターが表示される', () => {
      render(<GroupPage />);
      
      expect(screen.getByTestId('profile-selector-0')).toBeInTheDocument();
      expect(screen.getByTestId('profile-selector-1')).toBeInTheDocument();
      expect(screen.getByTestId('profile-selector-2')).toBeInTheDocument();
    });

    it('タイトルとヘッダーが表示される', () => {
      render(<GroupPage />);
      
      expect(screen.getByText('グループで相性診断')).toBeInTheDocument();
      expect(screen.getByText(/Prairie Cardをスキャン/)).toBeInTheDocument();
    });

    it('参加者追加ボタンが表示される', () => {
      render(<GroupPage />);
      
      expect(screen.getByRole('button', { name: /参加者を追加/ })).toBeInTheDocument();
    });

    it('診断開始ボタンが初期状態で無効になっている', () => {
      render(<GroupPage />);
      
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      expect(startButton).toBeDisabled();
    });
  });

  describe('参加者管理', () => {
    it('参加者を追加できる（最大10人）', () => {
      render(<GroupPage />);
      
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });
      
      // 7人追加（初期3人 + 7人 = 10人）
      for (let i = 0; i < 7; i++) {
        fireEvent.click(addButton);
      }
      
      expect(screen.getByTestId('profile-selector-9')).toBeInTheDocument();
      
      // 10人になったら追加ボタンが無効になる
      expect(addButton).toBeDisabled();
    });

    it('参加者を削除できる（最小3人）', () => {
      render(<GroupPage />);
      
      // 参加者を5人に増やす
      const addButton = screen.getByRole('button', { name: /参加者を追加/ });
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      
      // 削除ボタンをクリック
      const removeButtons = screen.getAllByRole('button', { name: /削除/ });
      fireEvent.click(removeButtons[4]); // 5人目を削除
      
      expect(screen.queryByTestId('profile-selector-4')).not.toBeInTheDocument();
    });

    it('3人未満にはできない', () => {
      render(<GroupPage />);
      
      const removeButtons = screen.getAllByRole('button', { name: /削除/ });
      
      // 3人の状態では削除ボタンが無効
      removeButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('プロファイル読み込み', () => {
    it('Prairie CardのURLからプロファイルを取得する', async () => {
      (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProfiles[0],
      });

      render(<GroupPage />);
      
      const scanButton = screen.getAllByText('スキャン')[0];
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/test');
      });
    });

    it('全員のプロファイルが読み込まれたら診断ボタンが有効になる', async () => {
      mockProfiles.forEach((profile, index) => {
        (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: profile,
        });
      });

      render(<GroupPage />);
      
      // 3人分のスキャン
      const scanButtons = screen.getAllByText('スキャン');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(scanButtons[i]);
      }

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(3);
      });

      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      expect(startButton).toBeEnabled();
    });

    it('プロファイル取得エラーを処理する', async () => {
      (apiClient.prairie.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch profile')
      );

      render(<GroupPage />);
      
      const scanButton = screen.getAllByText('スキャン')[0];
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/Prairie Cardの読み込みに失敗/)).toBeInTheDocument();
      });
    });
  });

  describe('診断実行', () => {
    beforeEach(async () => {
      mockProfiles.forEach(profile => {
        (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: profile,
        });
      });

      (apiClient.diagnosis.generate as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { result: mockDiagnosisResult },
      });
    });

    it('グループ診断を実行して結果を表示する', async () => {
      render(<GroupPage />);
      
      // プロファイル読み込み
      const scanButtons = screen.getAllByText('スキャン');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(scanButtons[i]);
      }

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(3);
      });

      // 診断開始
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(apiClient.diagnosis.generate).toHaveBeenCalledWith(
          mockProfiles,
          'group'
        );
      });

      expect(screen.getByTestId('diagnosis-result')).toBeInTheDocument();
      expect(screen.getByText('group - 75% - グループ診断結果')).toBeInTheDocument();
    });

    it('診断中にローディング画面を表示する', async () => {
      (apiClient.diagnosis.generate as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { result: mockDiagnosisResult },
        }), 100))
      );

      render(<GroupPage />);
      
      // プロファイル読み込み
      const scanButtons = screen.getAllByText('スキャン');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(scanButtons[i]);
      }

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(3);
      });

      // 診断開始
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      fireEvent.click(startButton);

      expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
      expect(screen.getByText(/診断中/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('diagnosis-result')).toBeInTheDocument();
      });
    });

    it('診断エラーを処理する', async () => {
      (apiClient.diagnosis.generate as jest.Mock).mockRejectedValueOnce(
        new Error('Diagnosis failed')
      );

      render(<GroupPage />);
      
      // プロファイル読み込み
      const scanButtons = screen.getAllByText('スキャン');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(scanButtons[i]);
      }

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(3);
      });

      // 診断開始
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/診断に失敗しました/)).toBeInTheDocument();
      });
    });
  });

  describe('URLパラメータ処理', () => {
    it('URLパラメータから自動的にプロファイルを読み込む', async () => {
      mockProfiles.forEach(profile => {
        (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: profile,
        });
      });

      render(<GroupPage />);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/user1');
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/user2');
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/user3');
      });
    });
  });

  describe('ナビゲーション', () => {
    it('戻るボタンでホームページに遷移する', () => {
      render(<GroupPage />);
      
      const backButton = screen.getByRole('button', { name: /戻る/ });
      fireEvent.click(backButton);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('バリデーション', () => {
    it('同じプロファイルを複数選択できない', async () => {
      const sameProfile = createMockProfile('SameUser');
      
      (apiClient.prairie.fetch as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: sameProfile })
        .mockResolvedValueOnce({ success: true, data: sameProfile });

      render(<GroupPage />);
      
      // 1人目のスキャン
      fireEvent.click(screen.getAllByText('スキャン')[0]);
      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(1);
      });

      // 2人目に同じプロファイル
      fireEvent.click(screen.getAllByText('スキャン')[1]);
      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
      });

      // エラーメッセージが表示される
      expect(screen.getByText(/同じプロファイルを複数選択することはできません/)).toBeInTheDocument();
    });
  });
});