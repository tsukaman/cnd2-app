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
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Array(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    arc: jest.fn(),
    fillText: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
  })),
});

// Mock HTMLCanvasElement dimensions
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  value: 300,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  value: 150,
  writable: true,
});

// Set up test environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:3000';
process.env.NODE_ENV = 'test';