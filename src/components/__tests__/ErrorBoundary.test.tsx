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
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    
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

  it('has reset button when error occurs', () => {
    // This test verifies that the reset button is present when an error occurs
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Verify error UI is displayed
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    // Verify the reset button is present
    const resetButton = screen.getByText('再試行');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton.tagName).toBe('BUTTON');
  });

  it('navigates to home when home button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const homeLink = screen.getByText('ホームへ').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('handles async errors', async () => {
    // Suppress the expected error from useEffect
    const originalError = console.error;
    console.error = jest.fn();
    
    const AsyncError = () => {
      React.useEffect(() => {
        // Error boundaries don't catch errors in event handlers, async code, or during SSR
        // This error will not be caught by the error boundary
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
      }, []);
      return <div>Loading</div>;
    };
    
    render(
      <ErrorBoundary>
        <AsyncError />
      </ErrorBoundary>
    );
    
    // Since error boundaries don't catch async errors, the component should still render
    expect(screen.getByText('Loading')).toBeInTheDocument();
    
    console.error = originalError;
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