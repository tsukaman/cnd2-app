import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiagnosisResult } from '../DiagnosisResult';
import { DiagnosisResult as DiagnosisResultType } from '@/types';

// Mock ShareButton component
jest.mock('@/components/share/ShareButton', () => ({
  __esModule: true,
  default: ({ result }: any) => <button>シェア</button>,
}));

// Mock QRCodeModal component  
jest.mock('@/components/share/QRCodeModal', () => ({
  QRCodeModal: ({ isOpen, onClose, url }: any) => 
    isOpen ? <div data-testid="qr-modal">{url}</div> : null,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// モックデータ
const mockDuoDiagnosis: DiagnosisResultType = {
  id: 'test-123',
  mode: 'duo',
  type: 'クラウドネイティブ・パートナー型',
  compatibility: 85,
  summary: 'テスト診断結果のサマリーです',
  strengths: ['強み1', '強み2', '強み3'],
  opportunities: ['機会1', '機会2', '機会3'],
  advice: 'アドバイス内容',
  participants: [
    {
      basic: {
        name: 'User1',
        title: 'Engineer',
        company: 'Tech Corp',
        bio: 'Bio1',
      },
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    },
    {
      basic: {
        name: 'User2',
        title: 'Developer',
        company: 'Web Inc',
        bio: 'Bio2',
      },
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    },
  ],
  createdAt: new Date().toISOString(),
};

const mockGroupDiagnosis: DiagnosisResultType = {
  ...mockDuoDiagnosis,
  mode: 'group',
  participants: [
    ...mockDuoDiagnosis.participants,
    {
      basic: {
        name: 'User3',
        title: 'Manager',
        company: 'Cloud Ltd',
        bio: 'Bio3',
      },
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    },
  ],
};

// Window properties mock
Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Clipboard API モック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock Confetti component
jest.mock('react-confetti', () => ({
  __esModule: true,
  default: () => <div data-testid="confetti" />,
}));

describe('DiagnosisResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('レンダリング', () => {
    it('2人診断の結果を正しく表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByText('診断結果')).toBeInTheDocument();
      expect(screen.getByText('クラウドネイティブ・パートナー型')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('テスト診断結果のサマリーです')).toBeInTheDocument();
    });

    it('グループ診断の結果を正しく表示する', () => {
      render(<DiagnosisResult result={mockGroupDiagnosis} />);
      
      expect(screen.getByText('診断結果')).toBeInTheDocument();
      expect(screen.getByText('3人')).toBeInTheDocument(); // グループ人数が表示される
    });

    it('強みを全て表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByText('強み1')).toBeInTheDocument();
      expect(screen.getByText('強み2')).toBeInTheDocument();
      expect(screen.getByText('強み3')).toBeInTheDocument();
    });

    it('改善機会を全て表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByText('機会1')).toBeInTheDocument();
      expect(screen.getByText('機会2')).toBeInTheDocument();
      expect(screen.getByText('機会3')).toBeInTheDocument();
    });

    it('アドバイスを表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByText('アドバイス内容')).toBeInTheDocument();
    });

    it('参加者情報を表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByText('User1')).toBeInTheDocument();
      expect(screen.getByText('User2')).toBeInTheDocument();
    });
  });

  describe('相性スコア表示', () => {
    it('高スコア（80%以上）の場合、適切なグラデーションで表示される', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const scoreElement = screen.getByText('85%');
      // Check that the element exists and has gradient classes
      expect(scoreElement).toBeInTheDocument();
      const parentElement = scoreElement.closest('[class*="from-"]');
      expect(parentElement).toBeInTheDocument();
    });

    it('中スコア（70-79%）の場合、適切なグラデーションで表示される', () => {
      const midScoreResult = { ...mockDuoDiagnosis, compatibility: 75 };
      render(<DiagnosisResult result={midScoreResult} />);
      
      const scoreElement = screen.getByText('75%');
      expect(scoreElement).toBeInTheDocument();
      const parentElement = scoreElement.closest('[class*="from-"]');
      expect(parentElement).toBeInTheDocument();
    });

    it('低スコア（70%未満）の場合、適切なグラデーションで表示される', () => {
      const lowScoreResult = { ...mockDuoDiagnosis, compatibility: 65 };
      render(<DiagnosisResult result={lowScoreResult} />);
      
      const scoreElement = screen.getByText('65%');
      expect(scoreElement).toBeInTheDocument();
      const parentElement = scoreElement.closest('[class*="from-"]');
      expect(parentElement).toBeInTheDocument();
    });
  });

  describe('シェア機能', () => {
    it('シェアボタンが表示される', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(screen.getByRole('button', { name: /シェア/i })).toBeInTheDocument();
    });

    it('URLをコピーボタンが動作する', async () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const copyButton = screen.getByRole('button', { name: /URLをコピー/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('test-123')
        );
      });
    });

    it('QRコードモーダルを開ける', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const qrButton = screen.getByRole('button', { name: /QRコード/i });
      fireEvent.click(qrButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('保存機能', () => {
    it('結果をlocalStorageに保存する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cnd2_results',
        expect.stringContaining('test-123')
      );
    });

    it('既存の結果に追加保存する', () => {
      const existingData = { 'old-id': { id: 'old-id' } };
      localStorageMock.setItem('cnd2_results', JSON.stringify(existingData));
      
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const savedData = JSON.parse(localStorageMock.getItem('cnd2_results') || '{}');
      expect(savedData).toHaveProperty('old-id');
      expect(savedData).toHaveProperty('test-123');
    });
  });

  describe('アニメーション', () => {
    it('初回レンダリング時にフェードインアニメーションが適用される', () => {
      const { container } = render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const animatedElement = container.querySelector('.animate-fadeIn');
      expect(animatedElement).toBeInTheDocument();
    });

    it('スコア表示にスライドアップアニメーションが適用される', () => {
      const { container } = render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const scoreSection = container.querySelector('.animate-slideUp');
      expect(scoreSection).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイルビューで適切にレイアウトされる', () => {
      // viewport設定のモック
      window.innerWidth = 375;
      
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const container = screen.getByTestId('diagnosis-result-container');
      expect(container).toHaveClass('px-4'); // モバイルパディング
    });

    it('デスクトップビューで適切にレイアウトされる', () => {
      window.innerWidth = 1024;
      
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const container = screen.getByTestId('diagnosis-result-container');
      expect(container).toHaveClass('max-w-4xl'); // デスクトップ最大幅
    });
  });

  describe('エラーハンドリング', () => {
    it('不完全なデータでもクラッシュしない', () => {
      const incompleteResult: DiagnosisResultType = {
        ...mockDuoDiagnosis,
        strengths: [],
        opportunities: [],
        advice: '',
      };
      
      const { container } = render(<DiagnosisResult result={incompleteResult} />);
      expect(container).toBeInTheDocument();
    });

    it('参加者データが不足していても表示される', () => {
      const noParticipantResult: DiagnosisResultType = {
        ...mockDuoDiagnosis,
        participants: [],
      };
      
      render(<DiagnosisResult result={noParticipantResult} />);
      expect(screen.getByText('診断結果')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const mainSection = screen.getByRole('article');
      expect(mainSection).toHaveAttribute('aria-label', '診断結果');
    });

    it('ボタンに適切なラベルが設定されている', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const shareButton = screen.getByRole('button', { name: /シェア/i });
      expect(shareButton).toHaveAttribute('aria-label');
    });
  });
});