import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrairieCardInput from '../PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';

jest.mock('@/hooks/usePrairieCard');

describe('PrairieCardInput', () => {
  const mockFetchProfile = jest.fn();
  const defaultProps = {
    value: 'testuser',
    onChange: jest.fn(),
    onFetch: jest.fn(),
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
    expect(input).toHaveValue('testuser');
  });

  it('calls onChange when input value changes', () => {
    render(<PrairieCardInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newuser' } });
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('newuser');
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
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
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

  it('calls fetchProfile and onFetch when button is clicked', async () => {
    const mockProfile = {
      basic: { name: 'Test User', company: 'Test Co', role: 'Engineer' },
      skills: ['JavaScript'],
      social: {},
    };
    
    mockFetchProfile.mockResolvedValue(mockProfile);
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockFetchProfile).toHaveBeenCalledWith('testuser');
    
    await waitFor(() => {
      expect(defaultProps.onFetch).toHaveBeenCalledWith(mockProfile);
    });
  });

  it('does not call onFetch when fetchProfile returns null', async () => {
    mockFetchProfile.mockResolvedValue(null);
    
    render(<PrairieCardInput {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockFetchProfile).toHaveBeenCalledWith('testuser');
    
    await waitFor(() => {
      expect(defaultProps.onFetch).not.toHaveBeenCalled();
    });
  });

  it('disables button when value is empty', () => {
    render(<PrairieCardInput {...defaultProps} value="" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('trims input value when fetching', async () => {
    const props = { ...defaultProps, value: '  testuser  ' };
    
    render(<PrairieCardInput {...props} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockFetchProfile).toHaveBeenCalledWith('testuser');
  });
});