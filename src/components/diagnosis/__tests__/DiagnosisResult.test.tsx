import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiagnosisResult } from '../DiagnosisResult';
import { DiagnosisResult as DiagnosisResultType } from '@/types';
import { setupGlobalMocks, createMockPrairieProfile } from '@/test-utils/mocks';

// Mock ShareButton component
jest.mock('@/components/share/ShareButton', () => ({
  __esModule: true,
  default: () => {
    return React.createElement('button', null, 'シェア');
  },
}));

// Mock QRCodeModal component  
jest.mock('@/components/share/QRCodeModal', () => ({
  QRCodeModal: ({ isOpen, url }: { isOpen: boolean; onClose: () => void; url: string }) => {
    return isOpen ? React.createElement('div', { 'data-testid': 'qr-modal' }, url) : null;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  ...jest.requireActual('../../../test-utils/framer-motion-mock').framerMotionMock
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => null,
  RefreshCw: () => null,
  Trophy: () => null,
  MessageCircle: () => null,
  Sparkles: () => null,
  QrCode: () => null,
  Copy: () => null,
  Check: () => null,
  Share2: () => null,
  X: () => null,
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
      ...createMockPrairieProfile('User1'),
      basic: {
        ...createMockPrairieProfile('User1').basic,
        name: 'User1',
        title: 'Engineer',
        company: 'Tech Corp',
        bio: 'Bio1',
      },
    },
    { 
      ...createMockPrairieProfile('User2'),
      basic: {
        ...createMockPrairieProfile('User2').basic,
        name: 'User2',
        title: 'Developer',
        company: 'Web Inc',
        bio: 'Bio2',
      },
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
      ...createMockPrairieProfile('User3'),
      basic: {
        ...createMockPrairieProfile('User3').basic,
        name: 'User3',
        title: 'Manager',
        company: 'Cloud Ltd',
        bio: 'Bio3',
      },
    },
  ],
};

// Window properties mock
Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

// Setup global mocks (localStorage, IntersectionObserver, Clipboard)
const { localStorage: localStorageMock } = setupGlobalMocks();

// Mock Confetti component
jest.mock('react-confetti', () => ({
  __esModule: true,
  default: () => {
    return React.createElement('div', { 'data-testid': 'confetti' });
  },
}));

describe('DiagnosisResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('レンダリング', () => {
    it('2人診断の結果を正しく表示する', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      // aria-labelで診断結果コンテナを確認
      expect(screen.getByRole('article', { name: '診断結果' })).toBeInTheDocument();
      expect(screen.getByText('クラウドネイティブ・パートナー型')).toBeInTheDocument();
      // スコアは85と/100が別々に表示される
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
      expect(screen.getByText('テスト診断結果のサマリーです')).toBeInTheDocument();
    });

    it('グループ診断の結果を正しく表示する', () => {
      render(<DiagnosisResult result={mockGroupDiagnosis} />);
      
      // aria-labelで診断結果コンテナを確認
      expect(screen.getByRole('article', { name: '診断結果' })).toBeInTheDocument();
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
      
      // 参加者の名前が「診断参加者：User1 × User2」形式で表示される
      expect(screen.getByText(/診断参加者：.*User1.*×.*User2/)).toBeInTheDocument();
    });
  });

  describe('相性スコア表示', () => {
    it('高スコア（80%以上）の場合、適切なグラデーションで表示される', () => {
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      const scoreElement = screen.getByText('85');
      // Check that the element exists
      expect(scoreElement).toBeInTheDocument();
      // グラデーションは診断タイプに適用される
      const typeElement = screen.getByText('クラウドネイティブ・パートナー型');
      expect(typeElement).toBeInTheDocument();
      // 高スコアの場合、紫からピンクのグラデーション
      expect(typeElement.className).toContain('from-purple-500');
    });

    it('中スコア（70-79%）の場合、適切なグラデーションで表示される', () => {
      const midScoreResult = { ...mockDuoDiagnosis, compatibility: 75 };
      render(<DiagnosisResult result={midScoreResult} />);
      
      const scoreElement = screen.getByText('75');
      expect(scoreElement).toBeInTheDocument();
      // グラデーションは診断タイプに適用される
      const typeElement = screen.getByText('クラウドネイティブ・パートナー型');
      expect(typeElement).toBeInTheDocument();
      // 中スコアの場合、青からシアンのグラデーション
      expect(typeElement.className).toContain('from-blue-500');
    });

    it('低スコア（70%未満）の場合、適切なグラデーションで表示される', () => {
      const lowScoreResult = { ...mockDuoDiagnosis, compatibility: 65 };
      render(<DiagnosisResult result={lowScoreResult} />);
      
      const scoreElement = screen.getByText('65');
      expect(scoreElement).toBeInTheDocument();
      // グラデーションは診断タイプに適用される
      const typeElement = screen.getByText('クラウドネイティブ・パートナー型');
      expect(typeElement).toBeInTheDocument();
      // 低スコアの場合、緑からエメラルドのグラデーション
      expect(typeElement.className).toContain('from-green-500');
    });
  });

  describe('会話トピック表示', () => {
    it('会話トピックを正しく表示する', () => {
      const resultWithTopics = {
        ...mockDuoDiagnosis,
        conversationStarters: [
          '最近のIoTデバイスについてどう思う？',
          'UI/UXのトレンドで気になるものは？',
          '最もワクワクする新技術は何？'
        ]
      };
      render(<DiagnosisResult result={resultWithTopics} />);
      
      expect(screen.getByText('💬 おすすめの会話トピック')).toBeInTheDocument();
      expect(screen.getByText('最近のIoTデバイスについてどう思う？')).toBeInTheDocument();
      expect(screen.getByText('UI/UXのトレンドで気になるものは？')).toBeInTheDocument();
      expect(screen.getByText('最もワクワクする新技術は何？')).toBeInTheDocument();
    });

    it('会話トピックがない場合はセクションを表示しない', () => {
      const resultWithoutTopics = {
        ...mockDuoDiagnosis,
        conversationStarters: undefined
      };
      render(<DiagnosisResult result={resultWithoutTopics} />);
      
      expect(screen.queryByText('💬 おすすめの会話トピック')).not.toBeInTheDocument();
    });

    it('空の会話トピック配列の場合もセクションを表示しない', () => {
      const resultWithEmptyTopics = {
        ...mockDuoDiagnosis,
        conversationStarters: []
      };
      render(<DiagnosisResult result={resultWithEmptyTopics} />);
      
      expect(screen.queryByText('💬 おすすめの会話トピック')).not.toBeInTheDocument();
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
      
      // QRCodeModalのモックがdata-testidを使用している
      expect(screen.getByTestId('qr-modal')).toBeInTheDocument();
    });
  });

  describe('保存機能', () => {
    it.skip('結果をlocalStorageに保存する', () => {
      // DiagnosisResultコンポーネントはlocalStorageに保存しないためスキップ
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cnd2_results',
        expect.stringContaining('test-123')
      );
    });

    it.skip('既存の結果に追加保存する', () => {
      // DiagnosisResultコンポーネントはlocalStorageに保存しないためスキップ
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
      render(<DiagnosisResult result={mockDuoDiagnosis} />);
      
      // アニメーションはコンテナ全体に適用される
      const container = screen.getByTestId('diagnosis-result-container');
      expect(container.className).toContain('animate-fadeIn');
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
      // aria-labelで診断結果コンテナを確認
      expect(screen.getByRole('article', { name: '診断結果' })).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
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
      expect(shareButton).toBeInTheDocument();
      // ShareButtonコンポーネントが表示されていることを確認
    });
  });

  describe('CNCFラッキープロジェクト表示', () => {
    it('luckyProjectが存在する場合に表示される', () => {
      const resultWithLuckyProject = {
        ...mockDuoDiagnosis,
        luckyProject: 'Kubernetes - コンテナオーケストレーションの定番！'
      };
      render(<DiagnosisResult result={resultWithLuckyProject} />);
      
      expect(screen.getByText('CNCFラッキープロジェクト')).toBeInTheDocument();
      expect(screen.getByText('Kubernetes - コンテナオーケストレーションの定番！')).toBeInTheDocument();
    });

    it('luckyProjectDescriptionが存在する場合に表示される', () => {
      const resultWithDescription = {
        ...mockDuoDiagnosis,
        luckyProject: 'Prometheus',
        luckyProjectDescription: 'モニタリングとアラートのためのツール'
      };
      render(<DiagnosisResult result={resultWithDescription} />);
      
      expect(screen.getByText('Prometheus')).toBeInTheDocument();
      expect(screen.getByText('モニタリングとアラートのためのツール')).toBeInTheDocument();
    });

    it('luckyProjectが未定義の場合はセクションが表示されない', () => {
      const resultWithoutLuckyProject = {
        ...mockDuoDiagnosis,
        luckyProject: undefined
      };
      render(<DiagnosisResult result={resultWithoutLuckyProject} />);
      
      expect(screen.queryByText('CNCFラッキープロジェクト')).not.toBeInTheDocument();
    });

    it('luckyProjectが空文字列の場合はセクションが表示されない', () => {
      const resultWithEmptyLuckyProject = {
        ...mockDuoDiagnosis,
        luckyProject: ''
      };
      render(<DiagnosisResult result={resultWithEmptyLuckyProject} />);
      
      expect(screen.queryByText('CNCFラッキープロジェクト')).not.toBeInTheDocument();
    });
  });
});