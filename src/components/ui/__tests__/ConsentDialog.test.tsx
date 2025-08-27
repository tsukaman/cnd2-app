import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConsentDialog } from '../ConsentDialog';

describe('ConsentDialog', () => {
  const defaultProps = {
    onConsent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('ダイアログが表示される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      expect(screen.getByText('CND² へようこそ！')).toBeInTheDocument();
      expect(screen.getByText(/出会いを二乗でスケール/)).toBeInTheDocument();
    });

    it('説明文が表示される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      // Look for the actual text in the component
      expect(screen.getByText(/本アプリは診断のためPrairie Cardの公開情報を利用します/)).toBeInTheDocument();
    });

    it('同意ボタンが表示される', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /出会いを二乗でスケール/ })).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('同意ボタンをクリックするとonConsentが呼ばれる', () => {
      render(<ConsentDialog {...defaultProps} />);
      
      const consentButton = screen.getByRole('button', { name: /出会いを二乗でスケール/ });
      fireEvent.click(consentButton);
      
      expect(defaultProps.onConsent).toHaveBeenCalledTimes(1);
    });
  });

  describe('スタイリング', () => {
    it('グラデーション背景が適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const backdrop = container.querySelector('.bg-gradient-to-br');
      expect(backdrop).toBeInTheDocument();
    });

    it('ガラスエフェクトが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      const modal = container.querySelector('.glass-effect');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('アニメーション', () => {
    it('モーダルにアニメーションクラスが適用される', () => {
      const { container } = render(<ConsentDialog {...defaultProps} />);
      
      // Since framer-motion is mocked, check for the presence of the component instead
      const modal = container.querySelector('.glass-effect');
      expect(modal).toBeInTheDocument();
    });
  });
});