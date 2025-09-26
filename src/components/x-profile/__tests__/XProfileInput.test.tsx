/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import XProfileInput from '../XProfileInput';
import { useXProfile } from '@/hooks/useXProfile';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';

// Mocks
jest.mock('@/hooks/useXProfile');
jest.mock('@/hooks/useClipboardPaste');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('XProfileInput', () => {
  const mockOnProfileLoaded = jest.fn();
  const mockFetchProfile = jest.fn();
  const mockClearError = jest.fn();
  const mockUseSampleData = jest.fn();
  const mockCheckClipboard = jest.fn();
  const mockClearPastedUrl = jest.fn();

  const sampleProfile = {
    basic: {
      id: '44196397',
      username: 'elonmusk',
      name: 'Elon Musk',
      bio: '🚀 SpaceX • 🚗 Tesla',
      location: 'Mars & Earth',
      website: 'https://tesla.com',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg',
      verified: true,
      protected: false,
      createdAt: '2009-06-02T20:12:29.000Z'
    },
    metrics: {
      followers: 150000000,
      following: 500,
      tweets: 30000,
      listed: 100000
    },
    details: {
      recentTweets: [],
      topics: ['space', 'ai'],
      hashtags: ['#spacex'],
      mentionedUsers: ['SpaceX'],
      languages: ['en'],
      activeHours: [8, 9]
    },
    analysis: {
      techStack: ['AI'],
      interests: ['space'],
      personality: 'Visionary'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useXProfile as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      profile: null,
      retryAttempt: 0,
      isRetrying: false,
      fetchProfile: mockFetchProfile,
      clearError: mockClearError,
      useSampleData: mockUseSampleData
    });

    (useClipboardPaste as jest.Mock).mockReturnValue({
      isSupported: true,
      lastPastedUrl: null,
      checkClipboard: mockCheckClipboard,
      clearPastedUrl: mockClearPastedUrl
    });
  });

  it('should render input field with correct placeholder', () => {
    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    expect(input).toBeInTheDocument();
  });

  it('should handle username input', () => {
    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'elonmusk' } });

    expect(input.value).toBe('elonmusk');
  });

  it('should handle form submission', async () => {
    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    const submitButton = screen.getByText('X プロフィールを読み込む');

    fireEvent.change(input, { target: { value: 'elonmusk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalledWith('elonmusk');
    });
  });

  it('should handle @ prefix in username', async () => {
    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    const submitButton = screen.getByText('X プロフィールを読み込む');

    fireEvent.change(input, { target: { value: '@elonmusk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Component removes @ prefix before calling fetchProfile
      expect(mockFetchProfile).toHaveBeenCalledWith('elonmusk');
    });
  });

  it('should call onProfileLoaded when profile is fetched', async () => {
    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    const submitButton = screen.getByText('X プロフィールを読み込む');

    fireEvent.change(input, { target: { value: 'elonmusk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnProfileLoaded).toHaveBeenCalledWith(sampleProfile);
    });
  });

  it('should display loading state', () => {
    (useXProfile as jest.Mock).mockReturnValue({
      loading: true,
      error: null,
      profile: null,
      retryAttempt: 0,
      isRetrying: false,
      fetchProfile: mockFetchProfile,
      clearError: mockClearError,
      useSampleData: mockUseSampleData
    });

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    expect(screen.getByText('プロフィール読み込み中...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    (useXProfile as jest.Mock).mockReturnValue({
      loading: false,
      error: 'ユーザーが見つかりません',
      profile: null,
      retryAttempt: 0,
      isRetrying: false,
      fetchProfile: mockFetchProfile,
      clearError: mockClearError,
      useSampleData: mockUseSampleData
    });

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    expect(screen.getByText('ユーザーが見つかりません')).toBeInTheDocument();
  });

  it('should display retry state', () => {
    (useXProfile as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      profile: null,
      retryAttempt: 2,
      isRetrying: true,
      fetchProfile: mockFetchProfile,
      clearError: mockClearError,
      useSampleData: mockUseSampleData
    });

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    expect(screen.getByText('接続を再試行中... (2/3)')).toBeInTheDocument();
  });

  it('should display profile preview when loaded', async () => {
    jest.useFakeTimers();
    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    const submitButton = screen.getByText('X プロフィールを読み込む');

    fireEvent.change(input, { target: { value: 'elonmusk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that onProfileLoaded was called with the correct profile
      expect(mockOnProfileLoaded).toHaveBeenCalledWith(sampleProfile);
    });

    // Fast-forward 2 seconds for the input to clear
    jest.advanceTimersByTime(2000);

    // After successful load, the component should reset and show ready state
    await waitFor(() => {
      expect(input).toHaveValue('');
    });

    jest.useRealTimers();
  });

  it('should handle clipboard paste', async () => {
    (useClipboardPaste as jest.Mock).mockReturnValue({
      isSupported: true,
      lastPastedUrl: 'https://x.com/elonmusk',
      checkClipboard: mockCheckClipboard,
      clearPastedUrl: mockClearPastedUrl
    });

    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalledWith('elonmusk');
    });

    expect(mockClearPastedUrl).toHaveBeenCalled();
  });

  it('should extract username from Twitter URL', async () => {
    (useClipboardPaste as jest.Mock).mockReturnValue({
      isSupported: true,
      lastPastedUrl: 'https://twitter.com/elonmusk',
      checkClipboard: mockCheckClipboard,
      clearPastedUrl: mockClearPastedUrl
    });

    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalledWith('elonmusk');
    });
  });

  it('should show clipboard button when supported', () => {
    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const clipboardButton = screen.getByTitle('クリップボードから貼り付け');
    expect(clipboardButton).toBeInTheDocument();

    fireEvent.click(clipboardButton);
    expect(mockCheckClipboard).toHaveBeenCalled();
  });

  it('should validate username format', async () => {
    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username');
    const submitButton = screen.getByText('X プロフィールを読み込む');

    // Invalid username (too long)
    fireEvent.change(input, { target: { value: 'verylongusernamethatexceedslimit' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetchProfile).not.toHaveBeenCalled();
    });
  });

  it('should show sample data button in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    (useXProfile as jest.Mock).mockReturnValue({
      loading: false,
      error: 'エラーが発生しました',
      profile: null,
      retryAttempt: 0,
      isRetrying: false,
      fetchProfile: mockFetchProfile,
      clearError: mockClearError,
      useSampleData: mockUseSampleData
    });

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const sampleDataButton = screen.getByText('サンプルデータを使用');
    expect(sampleDataButton).toBeInTheDocument();

    fireEvent.click(sampleDataButton);
    expect(mockUseSampleData).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should clear input after successful load', async () => {
    jest.useFakeTimers();
    mockFetchProfile.mockResolvedValueOnce(sampleProfile);

    render(<XProfileInput onProfileLoaded={mockOnProfileLoaded} />);

    const input = screen.getByPlaceholderText('@username または username') as HTMLInputElement;
    const submitButton = screen.getByText('X プロフィールを読み込む');

    fireEvent.change(input, { target: { value: 'elonmusk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnProfileLoaded).toHaveBeenCalledWith(sampleProfile);
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(input.value).toBe('');
    });

    jest.useRealTimers();
  });
});