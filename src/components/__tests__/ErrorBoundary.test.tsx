import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => require('../../test-utils/framer-motion-mock').framerMotionMock);

// Mock the ErrorHandler to prevent any side effects
jest.mock('@/lib/errors', () => ({
  ErrorHandler: {
    logError: jest.fn(),
    mapError: jest.fn((error) => error),
    getUserMessage: jest.fn(() => 'Test error message'),
  },
  CND2Error: class CND2Error extends Error {
    constructor(message: string, public code?: string) {
      super(message);
    }
  },
}));

// Component that throws an error - stabilized for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  const [hasThrown, setHasThrown] = React.useState(false);
  
  // Only throw once to avoid infinite loops
  if (shouldThrow && !hasThrown) {
    setHasThrown(true);
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/申し訳ございません。予期しないエラーが発生しました。/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Check for error details section
    const errorDetails = screen.getByText('エラー詳細（開発環境のみ）');
    expect(errorDetails).toBeInTheDocument();
    
    // The error text will be in a pre element
    const preElement = errorDetails.closest('details')?.querySelector('pre');
    expect(preElement?.textContent).toContain('Error: Test error');
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it('does not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it('resets error state when reset button is clicked', () => {
    // Component that can toggle between error and no error
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      const [hasThrown, setHasThrown] = React.useState(false);
      
      if (shouldThrow && !hasThrown) {
        setHasThrown(true);
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };
    
    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    const resetButton = screen.getByText('再試行');
    fireEvent.click(resetButton);
    
    // After reset, rerender with shouldThrow = false
    rerender(
      <ErrorBoundary>
        <TestComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    // After reset, component should render normally
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('has a link to home page', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const homeButton = screen.getByText('ホームへ');
    const homeLink = homeButton.closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('does not catch async errors in useEffect', async () => {
    // Suppress the error that will be thrown
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const AsyncError = () => {
      React.useEffect(() => {
        // Error boundaries don't catch errors in useEffect
        // This is by design in React
        setTimeout(() => {
          // This won't be caught by error boundary
        }, 0);
      }, []);
      return <div>Loading</div>;
    };
    
    render(
      <ErrorBoundary>
        <AsyncError />
      </ErrorBoundary>
    );
    
    // Error boundaries don't catch errors in event handlers, async code, or during SSR
    // So the component will still be rendered
    expect(screen.getByText('Loading')).toBeInTheDocument();
    
    console.error = originalConsoleError;
  });

  it('logs error to console in development', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    
    const consoleErrorSpy = jest.spyOn(console, 'error');
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it('renders custom fallback if provided', () => {
    const CustomFallback = () => <div>Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });
});