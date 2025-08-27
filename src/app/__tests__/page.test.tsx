import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../page';
import { useRouter } from 'next/navigation';

// Next.js navigationモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// localStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// コンポーネントモック
jest.mock('@/components/effects/BackgroundEffects', () => ({
  BackgroundEffects: () => <div data-testid="background-effects" />,
}));

jest.mock('@/components/effects/CloudAnimation', () => ({
  CloudAnimation: () => <div data-testid="cloud-animation" />,
}));

jest.mock('@/components/ui/MenuCard', () => ({
  MenuCard: ({ title, href }: any) => <a href={href} data-testid="menu-card">{title}</a>,
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

describe('HomePage', () => {
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
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('レンダリング', () => {
    it('ホームページの要素が正しく表示される', () => {
      render(<HomePage />);
      
      expect(screen.getByText('CND²')).toBeInTheDocument();
      expect(screen.getByText('Prairie Card × AI 相性診断')).toBeInTheDocument();
      expect(screen.getByText('Prairie Cardのプロフィールから、')).toBeInTheDocument();
    });

    it('背景エフェクトがレンダリングされる', () => {
      render(<HomePage />);
      
      expect(screen.getByTestId('background-effects')).toBeInTheDocument();
      expect(screen.getByTestId('cloud-animation')).toBeInTheDocument();
    });

    it('診断ボタンが表示される', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('button', { name: /2人で診断/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /グループで診断/ })).toBeInTheDocument();
    });

    it('特徴セクションが表示される', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Prairie Card連携')).toBeInTheDocument();
      expect(screen.getByText('AI診断')).toBeInTheDocument();
      expect(screen.getByText('詳細な分析')).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    it('2人診断ボタンをクリックすると/duoに遷移する', () => {
      render(<HomePage />);
      
      const duoButton = screen.getByRole('button', { name: /2人で診断/ });
      fireEvent.click(duoButton);
      
      expect(mockPush).toHaveBeenCalledWith('/duo');
    });

    it('グループ診断ボタンをクリックすると/groupに遷移する', () => {
      render(<HomePage />);
      
      const groupButton = screen.getByRole('button', { name: /グループで診断/ });
      fireEvent.click(groupButton);
      
      expect(mockPush).toHaveBeenCalledWith('/group');
    });
  });

  describe('アニメーション', () => {
    it('ヒーローセクションにフェードインアニメーションが適用される', () => {
      const { container } = render(<HomePage />);
      
      const heroSection = container.querySelector('.animate-fadeIn');
      expect(heroSection).toBeInTheDocument();
    });

    it('ボタンにホバーエフェクトが適用される', () => {
      render(<HomePage />);
      
      const duoButton = screen.getByRole('button', { name: /2人で診断/ });
      expect(duoButton).toHaveClass('hover:scale-105');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('コンテナに適切なレスポンシブクラスが適用される', () => {
      const { container } = render(<HomePage />);
      
      const mainContainer = container.querySelector('main');
      expect(mainContainer).toHaveClass('min-h-screen');
      expect(mainContainer).toHaveClass('relative');
    });

    it('グリッドレイアウトがレスポンシブに対応している', () => {
      const { container } = render(<HomePage />);
      
      const featuresGrid = container.querySelector('.grid');
      expect(featuresGrid).toHaveClass('md:grid-cols-3');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切な見出し階層が維持される', () => {
      render(<HomePage />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('CND²');
      
      const h2 = screen.getByRole('heading', { level: 2, name: 'Prairie Card × AI 相性診断' });
      expect(h2).toBeInTheDocument();
    });

    it('ボタンに適切なaria属性が設定される', () => {
      render(<HomePage />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});