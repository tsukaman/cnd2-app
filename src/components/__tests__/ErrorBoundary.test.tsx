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
    expect(screen.getByText('予期しないエラーが発生しました。')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('does not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('resets error state when reset button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    const resetButton = screen.getByText('もう一度試す');
    fireEvent.click(resetButton);
    
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('navigates to home when home button is clicked', () => {
    // Mock window.location.href
    delete (window as unknown as { location?: Location }).location;
    window.location = { href: '' } as unknown as Location;
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const homeButton = screen.getByText('ホームに戻る');
    fireEvent.click(homeButton);
    
    expect(window.location.href).toBe('/');
  });

  it('handles async errors', async () => {
    const AsyncError = () => {
      React.useEffect(() => {
        throw new Error('Async error');
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
  });

  it('logs error to console in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleErrorSpy = jest.spyOn(console, 'error');
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
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