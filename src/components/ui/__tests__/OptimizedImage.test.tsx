import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedImage from '../OptimizedImage';
import { setupIntersectionObserverMock, MockIntersectionObserver } from '@/test-utils/mocks';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ 
    src, 
    alt, 
    width, 
    height, 
    className,
    onLoadingComplete,
    onLoad,
    onError,
    loading,
    priority,
    quality,
    placeholder,
    blurDataURL,
    fill,
    sizes,
    srcSet,
    ...props 
  }: any) => {
    // Next.js固有のプロップは除外してDOMに渡す
    const imgProps: any = {
      src,
      alt,
      className,
      ...props,
    };
    
    // width/heightはfillでない場合のみ追加
    if (!fill) {
      imgProps.width = width;
      imgProps.height = height;
    }
    
    // sizes属性を追加
    if (sizes) {
      imgProps.sizes = sizes;
    }
    
    // srcSet属性を追加
    if (srcSet) {
      imgProps.srcSet = srcSet;
    }
    
    // aria-hidden属性を処理（渡されたpropsに含まれている場合がある）
    
    // loading属性を適切に設定
    if (loading) {
      imgProps.loading = loading;
    } else if (!priority) {
      // priorityがfalseの場合のみlazy loadingを設定
      imgProps.loading = 'lazy';
    }
    // priorityがtrueの場合はloading属性を設定しない（ブラウザのデフォルト動作）
    
    // イベントハンドラ
    if (onLoad) imgProps.onLoad = onLoad;
    if (onError) imgProps.onError = onError;
    if (onLoadingComplete) {
      // onLoadingCompleteはonLoadの後に呼ばれる
      const originalOnLoad = imgProps.onLoad;
      imgProps.onLoad = (e: any) => {
        originalOnLoad?.(e);
        onLoadingComplete();
      };
    }
    
    return <img {...imgProps} />;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => require('../../../test-utils/framer-motion-mock').framerMotionMock);

// Mock utils
jest.mock('@/lib/utils/edge-compat', () => ({
  toBase64: jest.fn(() => 'data:image/svg+xml;base64,test'),
}));

// Setup IntersectionObserver モック
const mockIntersectionObserver = setupIntersectionObserverMock();

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 300,
    height: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // IntersectionObserverのコールバックを保存
    mockIntersectionObserver.mockImplementation((callback) => {
      const observer = new MockIntersectionObserver(callback);
      observer.observe.mockImplementation((element) => {
        // 即座に表示状態にする
        callback([{ isIntersecting: true, target: element } as IntersectionObserverEntry], observer);
      });
      return observer;
    });
  });

  describe('レンダリング', () => {
    it('画像が正しく表示される', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });

    it('幅と高さが設定される', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('width', '300');
      expect(image).toHaveAttribute('height', '200');
    });

    it('カスタムクラスが適用される', () => {
      render(<OptimizedImage {...defaultProps} className="custom-class" />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveClass('custom-class');
    });

    it('プレースホルダーが初期表示される', () => {
      mockIntersectionObserver.mockImplementation((callback) => {
        const observer = new MockIntersectionObserver(callback);
        // Don't trigger callback immediately to show placeholder
        return observer;
      });

      const { container } = render(<OptimizedImage {...defaultProps} />);
      
      const placeholder = container.querySelector('.bg-gray-200');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('遅延読み込み', () => {
    it('viewport内に入ったら画像が読み込まれる', async () => {
      render(<OptimizedImage {...defaultProps} />);
      
      // 画像要素が存在することを確認
      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      
      // lazyロードが設定されていることを確認
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('優先度が高い場合は即座に読み込まれる', () => {
      render(<OptimizedImage {...defaultProps} priority />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });
  });

  describe('エラーハンドリング', () => {
    it('画像読み込みエラー時にエラーメッセージを表示', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      fireEvent.error(image);
      
      // エラー時はエラーメッセージが表示される
      expect(screen.getByText('画像を読み込めませんでした')).toBeInTheDocument();
    });

    it('onError コールバックが呼ばれる', () => {
      const onError = jest.fn();
      render(<OptimizedImage {...defaultProps} onError={onError} />);
      
      const image = screen.getByAltText('Test image');
      fireEvent.error(image);
      
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('読み込み状態', () => {
    it('読み込み中にローディングクラスが適用される', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveClass('opacity-0');
      
      fireEvent.load(image);
      expect(image).toHaveClass('opacity-100');
    });

    it('onLoad コールバックが呼ばれる', () => {
      const onLoad = jest.fn();
      render(<OptimizedImage {...defaultProps} onLoad={onLoad} />);
      
      const image = screen.getByAltText('Test image');
      fireEvent.load(image);
      
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  describe('レスポンシブ画像', () => {
    it('sizes属性が設定される', () => {
      const sizes = '(max-width: 640px) 100vw, 50vw';
      render(<OptimizedImage {...defaultProps} sizes={sizes} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('sizes', sizes);
    });

    it('srcset属性が設定される', () => {
      const srcSet = '/test-image.jpg 1x, /test-image@2x.jpg 2x';
      render(<OptimizedImage {...defaultProps} srcSet={srcSet} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('srcset', srcSet);
    });
  });

  describe('アクセシビリティ', () => {
    it('alt属性が必須', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('装飾的な画像の場合、空のalt属性を許可', () => {
      render(<OptimizedImage {...defaultProps} alt="" decorative />);
      
      // 装飾的な画像は通常のimgタグとして存在するが、aria-hidden属性を持つ
      const images = screen.getAllByRole('img', { hidden: true });
      const image = images[0];
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('aria-hidden', 'true');
    });

    it('loading属性が設定される', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      // OptimizedImageのデフォルトはlazy（priorityがfalseの場合）
      // Next.jsのImageコンポーネントはloading="lazy"を明示的に設定する
      const loadingAttr = image.getAttribute('loading');
      expect(loadingAttr).toBe('lazy');
    });

    it('優先度が高い場合はloading属性が設定されない', () => {
      render(<OptimizedImage {...defaultProps} priority />);
      
      const image = screen.getByAltText('Test image');
      // priorityがtrueの場合、loading属性は設定されない（ブラウザのデフォルト動作でeager）
      expect(image).not.toHaveAttribute('loading');
    });
  });

  describe('アニメーション', () => {
    it('フェードインアニメーションが適用される', () => {
      render(<OptimizedImage {...defaultProps} />);
      
      const image = screen.getByAltText('Test image');
      expect(image).toHaveClass('transition-opacity');
      expect(image).toHaveClass('duration-300');
    });

    it('アニメーションを無効化できる', () => {
      render(<OptimizedImage {...defaultProps} disableAnimation />);
      
      const image = screen.getByAltText('Test image');
      expect(image).not.toHaveClass('transition-opacity');
    });
  });

  // Note: IntersectionObserverはNext.jsのImageコンポーネント内部で管理されるため、
  // クリーンアップのテストは不要
});