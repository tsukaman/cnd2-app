/**
 * Common test utilities and mocks
 */

/**
 * Create a mock localStorage implementation
 */
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

/**
 * Create a mock IntersectionObserver implementation
 */
export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
}

/**
 * Setup IntersectionObserver mock with proper typing
 */
export const setupIntersectionObserverMock = () => {
  const mockIntersectionObserver = jest.fn().mockImplementation((callback, options) => {
    return new MockIntersectionObserver(callback, options);
  });
  
  window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
  
  return mockIntersectionObserver;
}

/**
 * Create mock for framer-motion
 */
export const createFramerMotionMock = () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('div', props, children);
    },
    button: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('button', props, children);
    },
    img: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('img', props, children);
    },
  },
  AnimatePresence: ({ children }: any) => children,
});

/**
 * Create mock Prairie profile data
 */
export const createMockPrairieProfile = (name = 'Test User', index = 0) => ({
  basic: {
    name: `${name}${index ? index : ''}`,
    title: 'Developer',
    company: 'Test Company',
    bio: 'Test bio',
    avatar: '',
  },
  details: {
    tags: ['tag1', 'tag2'],
    skills: ['skill1', 'skill2'],
    interests: ['interest1'],
    certifications: ['cert1'],
    communities: ['community1'],
  },
  social: {
    twitter: '@test',
    github: 'testuser',
  },
  custom: {},
  meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

/**
 * Setup global mocks for tests
 */
export const setupGlobalMocks = () => {
  // Setup localStorage mock
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Setup IntersectionObserver mock
  window.IntersectionObserver = jest.fn().mockImplementation((callback, options) => {
    return new MockIntersectionObserver(callback, options);
  }) as unknown as typeof IntersectionObserver;

  // Setup Clipboard API mock
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
    },
  });

  return {
    localStorage: localStorageMock,
  };
};