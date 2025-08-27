import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConsentDialog } from '../ConsentDialog';

describe('ConsentDialog', () => {
  const defaultProps = {
    isOpen: true,
    onAccept: jest.fn(),
    onDecline: jest.fn(),
    title: 'テストタイトル',
    message: 'テストメッセージ',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('開いている時にダイアログが表示される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('テストタイトル')).toBeInTheDocument();
      expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
    });

    it('閉じている時にダイアログが表示されない', () => {
      render(<ConsentDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('同意・拒否ボタンが表示される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /同意する/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /拒否する/ })).toBeInTheDocument();
    });

    it('カスタムボタンテキストが使用できる', () => {
      render(
        <ConsentDialog
          {...defaultProps}
          acceptText="はい"
          declineText="いいえ"
        />
      );
      
      expect(screen.getByRole('button', { name: 'はい' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'いいえ' })).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('同意ボタンをクリックするとonAcceptが呼ばれる', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const acceptButton = screen.getByRole('button', { name: /同意する/ });
      fireEvent.click(acceptButton);
      
      expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
      expect(defaultProps.onDecline).not.toHaveBeenCalled();
    });

    it('拒否ボタンをクリックするとonDeclineが呼ばれる', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const declineButton = screen.getByRole('button', { name: /拒否する/ });
      fireEvent.click(declineButton);
      
      expect(defaultProps.onDecline).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAccept).not.toHaveBeenCalled();
    });

    it('背景をクリックしても何も起こらない', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(defaultProps.onAccept).not.toHaveBeenCalled();
      expect(defaultProps.onDecline).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('オーバーレイとモーダルのスタイルが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const overlay = container.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
      
      const modal = container.querySelector('.bg-white.rounded-lg');
      expect(modal).toBeInTheDocument();
    });

    it('ボタンに適切なスタイルが適用される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const acceptButton = screen.getByRole('button', { name: /同意する/ });
      expect(acceptButton).toHaveClass('bg-blue-600');
      expect(acceptButton).toHaveClass('text-white');
      
      const declineButton = screen.getByRole('button', { name: /拒否する/ });
      expect(declineButton).toHaveClass('bg-gray-300');
    });

    it('ダークモード対応のスタイルが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const modal = container.querySelector('.dark\\:bg-gray-800');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('アニメーション', () => {
    it('モーダルにフェードインアニメーションが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const modal = container.querySelector('.animate-fadeIn');
      expect(modal).toBeInTheDocument();
    });

    it('モーダルにスケールアニメーションが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const modal = container.querySelector('.animate-scaleIn');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-labelledby属性が設定される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('aria-describedby属性が設定される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('フォーカストラップが機能する', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // 最初のボタンにフォーカスが当たることを確認
      expect(document.activeElement).toBe(buttons[0]);
    });
  });

  describe('長いテキストの処理', () => {
    it('長いタイトルが適切に折り返される', () => {
      const longTitle = 'これは非常に長いタイトルです。'.repeat(5);
      render(<ConsentDialog {...defaultProps} title={longTitle} />);
      
      const title = screen.getByText(longTitle);
      expect(title).toHaveClass('text-wrap');
    });

    it('長いメッセージが適切に折り返される', () => {
      const longMessage = 'これは非常に長いメッセージです。'.repeat(10);
      render(<ConsentDialog {...defaultProps} message={longMessage} />);
      
      const message = screen.getByText(longMessage);
      expect(message).toHaveClass('text-wrap');
    });
  });
});