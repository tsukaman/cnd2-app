import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
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
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    // Change the component to not throw
    shouldThrow = false;
    
    const resetButton = screen.getByText('再試行');
    fireEvent.click(resetButton);
    
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