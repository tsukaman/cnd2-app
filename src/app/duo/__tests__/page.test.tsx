import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DuoPage from '../page';
import { useRouter } from 'next/navigation';

// Next.js navigationモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key) => {
      if (key === 'participant1') return 'https://prairie.cards/test1';
      if (key === 'participant2') return 'https://prairie.cards/test2';
      return null;
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
      {result.compatibility}% - {result.summary}
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingScreen', () => ({
  LoadingScreen: ({ message }: any) => (
    <div data-testid="loading-screen">{message}</div>
  ),
}));

import { apiClient } from '@/lib/api-client';

describe('DuoPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  const mockProfile1 = {
    basic: {
      name: 'Test User 1',
      title: 'Engineer',
      company: 'Tech Corp',
      bio: 'Bio 1',
    },
    details: {
      tags: [],
      skills: ['JavaScript'],
      interests: ['Web'],
      certifications: [],
      communities: [],
    },
    social: {},
    custom: {},
    meta: {},
  };

  const mockProfile2 = {
    basic: {
      name: 'Test User 2',
      title: 'Designer',
      company: 'Design Inc',
      bio: 'Bio 2',
    },
    details: {
      tags: [],
      skills: ['Figma'],
      interests: ['UI/UX'],
      certifications: [],
      communities: [],
    },
    social: {},
    custom: {},
    meta: {},
  };

  const mockDiagnosisResult = {
    id: 'test-123',
    mode: 'duo',
    type: 'クラウドネイティブ・パートナー型',
    compatibility: 85,
    summary: 'テスト診断結果',
    strengths: ['強み1'],
    opportunities: ['機会1'],
    advice: 'アドバイス',
    participants: [mockProfile1, mockProfile2],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('レンダリング', () => {
    it('初期状態で2人分のプロファイルセレクターが表示される', () => {
      render(<DuoPage />);
      
      expect(screen.getByTestId('profile-selector-0')).toBeInTheDocument();
      expect(screen.getByTestId('profile-selector-1')).toBeInTheDocument();
    });

    it('タイトルとヘッダーが表示される', () => {
      render(<DuoPage />);
      
      expect(screen.getByText('2人で相性診断')).toBeInTheDocument();
      expect(screen.getByText('Prairie Cardをスキャンして')).toBeInTheDocument();
    });

    it('診断開始ボタンが初期状態で無効になっている', () => {
      render(<DuoPage />);
      
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      expect(startButton).toBeDisabled();
    });
  });

  describe('プロファイル読み込み', () => {
    it('Prairie CardのURLからプロファイルを取得する', async () => {
      (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProfile1,
      });

      render(<DuoPage />);
      
      const scanButton = screen.getAllByText('スキャン')[0];
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/test');
      });
    });

    it('2人分のプロファイルが読み込まれたら診断ボタンが有効になる', async () => {
      (apiClient.prairie.fetch as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockProfile1 })
        .mockResolvedValueOnce({ success: true, data: mockProfile2 });

      render(<DuoPage />);
      
      // 1人目のスキャン
      fireEvent.click(screen.getAllByText('スキャン')[0]);
      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(1);
      });

      // 2人目のスキャン  
      fireEvent.click(screen.getAllByText('スキャン')[1]);
      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
      });

      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      expect(startButton).toBeEnabled();
    });

    it('プロファイル取得エラーを処理する', async () => {
      (apiClient.prairie.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch profile')
      );

      render(<DuoPage />);
      
      const scanButton = screen.getAllByText('スキャン')[0];
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/Prairie Cardの読み込みに失敗/)).toBeInTheDocument();
      });
    });
  });

  describe('診断実行', () => {
    beforeEach(async () => {
      (apiClient.prairie.fetch as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockProfile1 })
        .mockResolvedValueOnce({ success: true, data: mockProfile2 });

      (apiClient.diagnosis.generate as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { result: mockDiagnosisResult },
      });
    });

    it('診断を実行して結果を表示する', async () => {
      render(<DuoPage />);
      
      // プロファイル読み込み
      fireEvent.click(screen.getAllByText('スキャン')[0]);
      fireEvent.click(screen.getAllByText('スキャン')[1]);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
      });

      // 診断開始
      const startButton = screen.getByRole('button', { name: /診断を開始/ });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(apiClient.diagnosis.generate).toHaveBeenCalledWith(
          [mockProfile1, mockProfile2],
          'duo'
        );
      });

      expect(screen.getByTestId('diagnosis-result')).toBeInTheDocument();
      expect(screen.getByText('85% - テスト診断結果')).toBeInTheDocument();
    });

    it('診断中にローディング画面を表示する', async () => {
      (apiClient.diagnosis.generate as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { result: mockDiagnosisResult },
        }), 100))
      );

      render(<DuoPage />);
      
      // プロファイル読み込み
      fireEvent.click(screen.getAllByText('スキャン')[0]);
      fireEvent.click(screen.getAllByText('スキャン')[1]);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
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

      render(<DuoPage />);
      
      // プロファイル読み込み
      fireEvent.click(screen.getAllByText('スキャン')[0]);
      fireEvent.click(screen.getAllByText('スキャン')[1]);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
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
      (apiClient.prairie.fetch as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockProfile1 })
        .mockResolvedValueOnce({ success: true, data: mockProfile2 });

      render(<DuoPage />);

      await waitFor(() => {
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/test1');
        expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://prairie.cards/test2');
      });
    });
  });

  describe('ナビゲーション', () => {
    it('戻るボタンでホームページに遷移する', () => {
      render(<DuoPage />);
      
      const backButton = screen.getByRole('button', { name: /戻る/ });
      fireEvent.click(backButton);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});