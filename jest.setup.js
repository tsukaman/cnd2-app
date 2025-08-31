// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Add TextEncoder/TextDecoder for Node environment
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Mock NextResponse for Jest environment
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  
  class MockNextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = (init && init.status) || 200;
      this.statusText = (init && init.statusText) || 'OK';
      this.headers = new Map();
      
      // Add headers from init
      if (init && init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
    
    // Mock json method for tests
    json() {
      return Promise.resolve(this.body);
    }
    
    // Static json method that creates a MockNextResponse
    static json(data, init) {
      return new MockNextResponse(data, init);
    }
  }
  
  return {
    ...actual,
    NextResponse: MockNextResponse,
    NextRequest: actual.NextRequest || class MockNextRequest {
      constructor(url, init) {
        this.url = url;
        this.method = (init && init.method) || 'GET';
        this.headers = new Map();
        this.nextUrl = {
          pathname: new URL(url).pathname,
          searchParams: new URL(url).searchParams,
        };
      }
      
      json() {
        return Promise.resolve({});
      }
    },
  };
});

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
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.root = null;
    this.rootMargin = '';
    this.thresholds = [];
  }
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
};

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

// Mock react-confetti to avoid canvas issues
jest.mock('react-confetti', () => {
  return function MockConfetti() {
    return null; // Don't render anything in tests
  };
});

// Mock HTMLCanvasElement for other canvas operations
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

// Set up default fetch mock
if (!global.fetch || !global.fetch.mockImplementation) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
      text: () => Promise.resolve(''),
      status: 200,
      statusText: 'OK',
    })
  );
}

// Clean up after each test
// Remove global timer setup - let individual tests handle their own timer setup
afterEach(() => {
  jest.clearAllMocks();
});