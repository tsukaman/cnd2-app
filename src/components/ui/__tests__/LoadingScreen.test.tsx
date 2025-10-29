import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  describe('レンダリング', () => {
    it('CND²ロゴが表示される', () => {
      render(<LoadingScreen />);
      
      expect(screen.getByText('CND²')).toBeInTheDocument();
    });

    it('アニメーションドットが表示される', () => {
      const { container } = render(<LoadingScreen />);

      // 3つのアニメーションドットが存在することを確認
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('グラデーション背景が表示される', () => {
      const { container } = render(<LoadingScreen />);

      const background = container.querySelector('.min-h-screen');
      expect(background).toBeInTheDocument();
      // 新しい明るいカラースキームのグラデーションを確認
      expect(background?.getAttribute('style')).toContain('linear-gradient(135deg, #E0F2FE');
    });

    it('中央配置でレンダリングされる', () => {
      const { container } = render(<LoadingScreen />);
      
      const centerContainer = container.querySelector('.flex.items-center.justify-center');
      expect(centerContainer).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('フルスクリーンビューが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const fullscreen = container.querySelector('.min-h-screen');
      expect(fullscreen).toBeInTheDocument();
    });

    it('グラデーション背景が適用される', () => {
      const { container } = render(<LoadingScreen />);

      const gradient = container.querySelector('.min-h-screen');
      expect(gradient).toBeInTheDocument();
      // 明るいカラースキームのグラデーションを確認
      const style = gradient?.getAttribute('style');
      expect(style).toContain('#E0F2FE');
      expect(style).toContain('#FEF3C7');
      expect(style).toContain('#FED7AA');
    });

    it('中央配置のスタイルが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const content = container.querySelector('.flex.items-center.justify-center');
      expect(content).toBeInTheDocument();
    });
  });
});