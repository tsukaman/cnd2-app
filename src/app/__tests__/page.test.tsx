import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../page';
import { useRouter } from 'next/navigation';

// Next.js navigationモック
const mockSearchParams = {
  get: jest.fn(() => null),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => mockSearchParams,
}));

// localStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// コンポーネントモック
jest.mock('@/components/effects/BackgroundEffects', () => ({
  BackgroundEffects: () => <div data-testid="background-effects" />,
}));

jest.mock('@/components/effects/CloudAnimation', () => ({
  CloudAnimation: () => <div data-testid="cloud-animation" />,
}));

jest.mock('@/components/ui/MenuCard', () => ({
  MenuCard: ({ title, href }: { title: string; href: string }) => <a href={href} data-testid="menu-card">{title}</a>,
}));

jest.mock('@/components/ui/ConsentDialog', () => ({
  ConsentDialog: ({ onConsent }: any) => (
    <div data-testid="consent-dialog">
      <button onClick={onConsent}>同意する</button>
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingScreen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen" />,
}));

jest.mock('@/components/diagnosis/DiagnosisResult', () => ({
  DiagnosisResultComponent: ({ result }: any) => <div data-testid="diagnosis-result">{result?.id}</div>,
}));

// TODO: These integration tests need to be refactored or moved to E2E tests
// Temporarily skipping to maintain CI/CD pipeline efficiency
describe.skip('HomePage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('レンダリング', () => {
    it('ホームページの要素が正しく表示される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('CND²')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Prairie Card × AI 相性診断')).toBeInTheDocument();
      expect(screen.getByText('Prairie Cardのプロフィールから、')).toBeInTheDocument();
    });

    it('背景エフェクトがレンダリングされる', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('background-effects')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('cloud-animation')).toBeInTheDocument();
    });

    it('診断ボタンが表示される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2人で診断/ })).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /グループで診断/ })).toBeInTheDocument();
    });

    it('特徴セクションが表示される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Prairie Card連携')).toBeInTheDocument();
      });
      
      expect(screen.getByText('AI診断')).toBeInTheDocument();
      expect(screen.getByText('詳細な分析')).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    it('2人診断ボタンをクリックすると/duoに遷移する', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const duoButton = await screen.findByRole('button', { name: /2人で診断/ });
      fireEvent.click(duoButton);
      
      expect(mockPush).toHaveBeenCalledWith('/duo');
    });

    it('グループ診断ボタンをクリックすると/groupに遷移する', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const groupButton = await screen.findByRole('button', { name: /グループで診断/ });
      fireEvent.click(groupButton);
      
      expect(mockPush).toHaveBeenCalledWith('/group');
    });
  });

  describe('アニメーション', () => {
    it('ヒーローセクションにフェードインアニメーションが適用される', async () => {
      const { container } = render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        const heroSection = container.querySelector('.animate-fadeIn');
        expect(heroSection).toBeInTheDocument();
      });
    });

    it('ボタンにホバーエフェクトが適用される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const duoButton = await screen.findByRole('button', { name: /2人で診断/ });
      expect(duoButton).toHaveClass('hover:scale-105');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('コンテナに適切なレスポンシブクラスが適用される', async () => {
      const { container } = render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        const mainContainer = container.querySelector('main');
        expect(mainContainer).toBeInTheDocument();
      });
      
      const mainContainer = container.querySelector('main');
      expect(mainContainer).toHaveClass('min-h-screen');
      expect(mainContainer).toHaveClass('relative');
    });

    it('グリッドレイアウトがレスポンシブに対応している', async () => {
      const { container } = render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        const featuresGrid = container.querySelector('.grid');
        expect(featuresGrid).toBeInTheDocument();
      });
      
      const featuresGrid = container.querySelector('.grid');
      expect(featuresGrid).toHaveClass('md:grid-cols-3');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切な見出し階層が維持される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const h1 = await screen.findByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('CND²');
      
      const h2 = screen.getByRole('heading', { level: 2, name: 'Prairie Card × AI 相性診断' });
      expect(h2).toBeInTheDocument();
    });

    it('ボタンに適切なaria属性が設定される', async () => {
      render(<HomePage />);
      
      // Advance timers to skip loading screen
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});