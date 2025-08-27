// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Add TextEncoder/TextDecoder for Node environment
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill for Response, Headers, Request and fetch in test environment
const fetch = require('node-fetch');
if (!global.Response) {
  global.Response = fetch.Response;
}
if (!global.Headers) {
  global.Headers = fetch.Headers;
}
if (!global.Request) {
  global.Request = fetch.Request;
}
if (!global.fetch) {
  global.fetch = fetch;
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_, tag) => {
          return React.forwardRef((props, ref) => {
            const { 
              initial, animate, exit, transition, variants,
              whileHover, whileTap, whileFocus, whileDrag, whileInView,
              drag, dragConstraints, dragElastic, dragMomentum,
              onAnimationStart, onAnimationComplete,
              layoutId, layout, layoutScroll,
              ...domProps 
            } = props;
            return React.createElement(tag, { ...domProps, ref });
          });
        },
      },
    ),
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useMotionValue: jest.fn(() => ({
      get: () => 0,
      set: jest.fn(),
    })),
    useTransform: jest.fn((value) => value),
    useViewportScroll: jest.fn(() => ({
      scrollY: { get: () => 0 },
      scrollYProgress: { get: () => 0 },
    })),
  };
});

// Mock HTMLCanvasElement for confetti library
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 300;
    this.height = 150;
  }

  getContext(contextType) {
    // Only return context for '2d', return null for other context types like 'webgl'
    if (contextType === '2d') {
      return {
        // Drawing methods
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        strokeRect: jest.fn(),
        
        // Path methods
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        ellipse: jest.fn(),
        rect: jest.fn(),
        
        // Drawing state
        save: jest.fn(),
        restore: jest.fn(),
        
        // Transformations
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        setTransform: jest.fn(),
        resetTransform: jest.fn(),
        
        // Compositing and colors
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        
        // Fill and stroke styles
        fillStyle: '#000000',
        strokeStyle: '#000000',
        
        // Line styles
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        miterLimit: 10,
        lineDashOffset: 0,
        getLineDash: jest.fn(() => []),
        setLineDash: jest.fn(),
        
        // Text
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'ltr',
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn(() => ({ 
          width: 0, 
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: 0,
          fontBoundingBoxAscent: 0,
          fontBoundingBoxDescent: 0,
          actualBoundingBoxAscent: 0,
          actualBoundingBoxDescent: 0,
          emHeightAscent: 0,
          emHeightDescent: 0,
          hangingBaseline: 0,
          alphabeticBaseline: 0,
          ideographicBaseline: 0,
        })),
        
        // Drawing images
        drawImage: jest.fn(),
        
        // Pixel manipulation
        createImageData: jest.fn(() => ({ 
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1 
        })),
        getImageData: jest.fn(() => ({ 
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1 
        })),
        putImageData: jest.fn(),
        
        // Paths
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(() => false),
        isPointInStroke: jest.fn(() => false),
        
        // Canvas dimensions
        canvas: {
          width: 300,
          height: 150,
        }
      };
    }
    return null;
  }

  // Additional canvas methods that might be used
  toDataURL() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  toBlob(callback) {
    setTimeout(() => callback(new Blob(['fake'], { type: 'image/png' })), 0);
  }
};

// Set up test environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:3000';
process.env.NODE_ENV = 'test';