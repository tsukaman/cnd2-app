import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrairieCardInput from '../PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';

jest.mock('@/hooks/usePrairieCard');

describe('PrairieCardInput', () => {
  const mockFetchProfile = jest.fn();
  const defaultProps = {
    onProfileLoaded: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePrairieCard as jest.Mock).mockReturnValue({
      fetchProfile: mockFetchProfile,
      loading: false,
      error: null,
    });
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
    });
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Prairie Card読み込み中...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    (usePrairieCard as jest.Mock).mockReturnValue({
      fetchProfile: mockFetchProfile,
      loading: false,
      error: 'Failed to fetch',
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
    
    expect(mockFetchProfile).toHaveBeenCalledWith('https://prairie-card.cloudnativedays.jp/u/testuser');
    
    await waitFor(() => {
      expect(defaultProps.onProfileLoaded).toHaveBeenCalledWith(mockProfile);
    });
  });

  it('does not call onProfileLoaded when fetchProfile returns null', async () => {
    mockFetchProfile.mockResolvedValue(null);
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://prairie-card.cloudnativedays.jp/u/testuser' } });
    
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(mockFetchProfile).toHaveBeenCalledWith('https://prairie-card.cloudnativedays.jp/u/testuser');
    
    await waitFor(() => {
      expect(defaultProps.onProfileLoaded).not.toHaveBeenCalled();
    });
  });

  it('disables button when input is empty', () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    const button = screen.getByRole('button');
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