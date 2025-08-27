import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileSelector } from '../ProfileSelector';

// Clipboard API モック
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(),
    writeText: jest.fn(),
  },
});

const mockProfile = {
  basic: {
    name: 'Test User',
    title: 'Engineer',
    company: 'Tech Corp',
    bio: 'Test bio',
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

describe('ProfileSelector', () => {
  const defaultProps = {
    onScan: jest.fn(),
    index: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('初期状態で正しく表示される', () => {
      render(<ProfileSelector {...defaultProps} />);
      
      expect(screen.getByText('参加者 1')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /スキャン/i })).toBeInTheDocument();
    });

    it('indexに基づいて参加者番号が表示される', () => {
      render(<ProfileSelector {...defaultProps} index={1} />);
      
      expect(screen.getByText('参加者 2')).toBeInTheDocument();
    });

    it('プロファイルがある場合、プロファイル情報を表示する', () => {
      render(<ProfileSelector {...defaultProps} profile={mockProfile} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('エラーメッセージが表示される', () => {
      render(<ProfileSelector {...defaultProps} error="エラーが発生しました" />);
      
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  describe('URL入力', () => {
    it('URLを入力できる', () => {
      render(<ProfileSelector {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'https://prairie.cards/test' } });
      
      expect(input).toHaveValue('https://prairie.cards/test');
    });

    it('空のURLではスキャンボタンが無効になる', () => {
      render(<ProfileSelector {...defaultProps} />);
      
      const scanButton = screen.getByRole('button', { name: /スキャン/i });
      expect(scanButton).toBeDisabled();
    });

    it('URLが入力されたらスキャンボタンが有効になる', () => {
      render(<ProfileSelector {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'https://prairie.cards/test' } });
      
      const scanButton = screen.getByRole('button', { name: /スキャン/i });
      expect(scanButton).toBeEnabled();
    });
  });

  describe('スキャン機能', () => {
    it('スキャンボタンをクリックしたらonScanが呼ばれる', () => {
      const mockOnScan = jest.fn();
      render(<ProfileSelector {...defaultProps} onScan={mockOnScan} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'https://prairie.cards/test' } });
      
      const scanButton = screen.getByRole('button', { name: /スキャン/i });
      fireEvent.click(scanButton);
      
      expect(mockOnScan).toHaveBeenCalledWith('https://prairie.cards/test');
    });

    it('URLの前後の空白が除去される', () => {
      const mockOnScan = jest.fn();
      render(<ProfileSelector {...defaultProps} onScan={mockOnScan} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '  https://prairie.cards/test  ' } });
      
      const scanButton = screen.getByRole('button', { name: /スキャン/i });
      fireEvent.click(scanButton);
      
      expect(mockOnScan).toHaveBeenCalledWith('https://prairie.cards/test');
    });

    it('ローディング中はボタンが無効になる', () => {
      render(<ProfileSelector {...defaultProps} loading={true} />);
      
      const scanButton = screen.getByRole('button', { name: /読み込み中/i });
      expect(scanButton).toBeDisabled();
    });
  });

  describe('クリップボード機能', () => {
    it('クリップボードから貼り付けできる', async () => {
      const mockOnScan = jest.fn();
      (navigator.clipboard.readText as jest.Mock).mockResolvedValueOnce('https://prairie.cards/clipboard');
      
      render(<ProfileSelector {...defaultProps} onScan={mockOnScan} />);
      
      const pasteButton = screen.getByTitle('クリップボードから貼り付け');
      fireEvent.click(pasteButton);
      
      await waitFor(() => {
        expect(mockOnScan).toHaveBeenCalledWith('https://prairie.cards/clipboard');
      });
    });

    it('クリップボード読み取りエラーを処理する', async () => {
      (navigator.clipboard.readText as jest.Mock).mockRejectedValueOnce(new Error('Access denied'));
      
      render(<ProfileSelector {...defaultProps} />);
      
      const pasteButton = screen.getByTitle('クリップボードから貼り付け');
      fireEvent.click(pasteButton);
      
      // エラーが発生してもクラッシュしない
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });

  describe('アニメーション', () => {
    it('インデックスに基づいて遅延アニメーションが適用される', () => {
      render(<ProfileSelector {...defaultProps} index={2} />);
      
      // framer-motionは jest.setup.js でモック化されているので、
      // 実際のアニメーションは実行されないが、コンポーネントが正常にレンダリングされることを確認
      expect(screen.getByText('参加者 3')).toBeInTheDocument();
    });
  });

  describe('プロファイル表示', () => {
    it('プロファイル表示時に変更ボタンが表示される', () => {
      render(<ProfileSelector {...defaultProps} profile={mockProfile} />);
      
      expect(screen.getByRole('button', { name: /変更/i })).toBeInTheDocument();
    });

    it('プロファイルがない場合は入力フィールドが表示される', () => {
      render(<ProfileSelector {...defaultProps} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Prairie Card URL')).toBeInTheDocument();
    });
  });

  describe('無効化状態', () => {
    it('ローディング中は入力フィールドが無効になる', () => {
      render(<ProfileSelector {...defaultProps} loading={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('ローディング中はペーストボタンが無効になる', () => {
      render(<ProfileSelector {...defaultProps} loading={true} />);
      
      const pasteButton = screen.getByTitle('クリップボードから貼り付け');
      expect(pasteButton).toBeDisabled();
    });
  });
});