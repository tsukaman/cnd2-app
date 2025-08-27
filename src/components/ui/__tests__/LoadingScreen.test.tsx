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
      const dots = container.querySelectorAll('.bg-cyan-400.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('グラデーション背景が表示される', () => {
      const { container } = render(<LoadingScreen />);
      
      const background = container.querySelector('.bg-gradient-to-br');
      expect(background).toBeInTheDocument();
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
      
      const gradient = container.querySelector('.from-blue-900.via-purple-900.to-pink-900');
      expect(gradient).toBeInTheDocument();
    });

    it('中央配置のスタイルが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const content = container.querySelector('.flex.items-center.justify-center');
      expect(content).toBeInTheDocument();
    });
  });
});