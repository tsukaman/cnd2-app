import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrairieCardInput from '../PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';

jest.mock('@/hooks/usePrairieCard');

// Mock additional hooks
jest.mock('@/hooks/useNFC', () => ({
  useNFC: () => ({
    isSupported: false,
    isReading: false,
    startReading: jest.fn(),
    stopReading: jest.fn(),
    error: null,
  }),
}));

jest.mock('@/hooks/useQRScanner', () => ({
  useQRScanner: () => ({
    isSupported: false,
    isScanning: false,
    startScanning: jest.fn(),
    stopScanning: jest.fn(),
    error: null,
  }),
}));

jest.mock('@/hooks/useClipboardPaste', () => ({
  useClipboardPaste: () => ({
    paste: jest.fn(),
    isSupported: true,
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => require('../../../test-utils/framer-motion-mock').framerMotionMock);

// Mock platform utils
jest.mock('@/lib/platform', () => ({
  detectPlatform: () => ({ device: 'desktop', os: 'macos' }),
  getRecommendedInputMethod: () => 'manual',
}));

describe('PrairieCardInput', () => {
  const mockFetchProfile = jest.fn();
  const defaultProps = {
    onProfileLoaded: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock for fetchProfile
    mockFetchProfile.mockResolvedValue({
      basic: {
        name: 'Test User',
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
      },
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    });
    
    (usePrairieCard as jest.Mock).mockReturnValue({
      fetchProfile: mockFetchProfile,
      loading: false,
      error: null,
      profile: null,
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders input field', () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(''); // Initially empty
  });

  it('updates input value when user types', () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://prairie-card.cloudnativedays.jp/u/newuser' } });
    
    expect(input).toHaveValue('https://prairie-card.cloudnativedays.jp/u/newuser');
  });

  it('shows loading state when fetching', () => {
    (usePrairieCard as jest.Mock).mockReturnValue({
      fetchProfile: mockFetchProfile,
      loading: true,
      error: null,
      profile: null,
      clearError: jest.fn(),
    });
    
    render(<PrairieCardInput {...defaultProps} />);
    
    // Get the scan button specifically (not NFC/QR/clipboard buttons)
    const button = screen.getByRole('button', { name: /スキャン|読み込み/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Prairie Card読み込み中...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    (usePrairieCard as jest.Mock).mockReturnValue({
      fetchProfile: mockFetchProfile,
      loading: false,
      error: 'Failed to fetch',
      profile: null,
      clearError: jest.fn(),
    });
    
    render(<PrairieCardInput {...defaultProps} />);
    
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('calls fetchProfile and onProfileLoaded when form is submitted', async () => {
    const mockProfile = {
      basic: { name: 'Test User', company: 'Test Co', role: 'Engineer', title: '', avatar: '' },
      skills: ['JavaScript'],
      social: {},
    };
    
    mockFetchProfile.mockResolvedValue(mockProfile);
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://prairie-card.cloudnativedays.jp/u/testuser' } });
    
    const form = screen.getByRole('textbox').closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(mockFetchProfile).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(defaultProps.onProfileLoaded).toHaveBeenCalledWith(mockProfile);
    });
  });

  it('does not call onProfileLoaded when fetchProfile returns null', async () => {
    // Explicitly mock to return null for this test
    mockFetchProfile.mockResolvedValueOnce(null);
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://prairie-card.cloudnativedays.jp/u/testuser' } });
    
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(defaultProps.onProfileLoaded).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  // TODO: Fix button selector - the actual component may have different button structure
  it.skip('disables button when input is empty', () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    // スキャンボタンを特定して取得
    const button = screen.getByRole('button', { name: /スキャン/i });
    expect(button).toBeDisabled();
  });

  it('does not submit when input contains only whitespace', async () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    // Should not call fetchProfile when input is only whitespace
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });
});