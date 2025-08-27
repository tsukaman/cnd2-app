import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  describe('レンダリング', () => {
    it('デフォルトメッセージが表示される', () => {
      render(<LoadingScreen />);
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('カスタムメッセージが表示される', () => {
      render(<LoadingScreen message="データを処理中です" />);
      
      expect(screen.getByText('データを処理中です')).toBeInTheDocument();
    });

    it('スピナーアニメーションが表示される', () => {
      const { container } = render(<LoadingScreen />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('クラウドアイコンが表示される', () => {
      const { container } = render(<LoadingScreen />);
      
      const cloudIcon = container.querySelector('svg');
      expect(cloudIcon).toBeInTheDocument();
      expect(cloudIcon).toHaveClass('text-blue-500');
    });
  });

  describe('スタイリング', () => {
    it('フルスクリーンオーバーレイが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const overlay = container.firstChild;
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
    });

    it('背景にブラー効果が適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('中央配置のスタイルが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const content = container.querySelector('.flex.items-center.justify-center');
      expect(content).toBeInTheDocument();
    });
  });

  describe('アニメーション', () => {
    it('スピナーに回転アニメーションが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveStyle({ animation: expect.stringContaining('spin') });
    });

    it('テキストにパルスアニメーションが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const text = container.querySelector('.animate-pulse');
      expect(text).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria-live属性が設定される', () => {
      const { container } = render(<LoadingScreen />);
      
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('スクリーンリーダー用のテキストが含まれる', () => {
      render(<LoadingScreen message="処理中" />);
      
      expect(screen.getByText('処理中')).toHaveAttribute('role', 'status');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイルとデスクトップで適切にレンダリングされる', () => {
      const { container } = render(<LoadingScreen />);
      
      const contentBox = container.querySelector('.p-8');
      expect(contentBox).toBeInTheDocument();
      expect(contentBox).toHaveClass('rounded-xl');
    });
  });
});