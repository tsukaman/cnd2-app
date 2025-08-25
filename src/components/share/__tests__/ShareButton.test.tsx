import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '../ShareButton';

describe('ShareButton', () => {
  const defaultProps = {
    resultId: 'test-123',
    score: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders share button', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    expect(button).toBeInTheDocument();
  });

  it('shows share options when clicked', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LINE')).toBeInTheDocument();
    expect(screen.getByText('URLをコピー')).toBeInTheDocument();
  });

  it('hides share options when clicked outside', async () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    
    // Click outside
    fireEvent.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('X (Twitter)')).not.toBeInTheDocument();
    });
  });

  it('opens Twitter share link when Twitter option is clicked', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const twitterButton = screen.getByText('X (Twitter)').closest('button');
    if (twitterButton) {
      fireEvent.click(twitterButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank'
      );
    }
  });

  it('opens Facebook share link when Facebook option is clicked', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const facebookButton = screen.getByText('Facebook').closest('button');
    if (facebookButton) {
      fireEvent.click(facebookButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://www.facebook.com/sharer'),
        '_blank'
      );
    }
  });

  it('opens LINE share link when LINE option is clicked', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const lineButton = screen.getByText('LINE').closest('button');
    if (lineButton) {
      fireEvent.click(lineButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://social-plugins.line.me/lineit/share'),
        '_blank'
      );
    }
  });

  it('copies URL to clipboard when copy option is clicked', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const copyButton = screen.getByText('URLをコピー').closest('button');
    if (copyButton) {
      fireEvent.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith(
        'https://cdn2.cloudnativedays.jp/result/test-123'
      );
      
      await waitFor(() => {
        expect(screen.getByText('コピーしました！')).toBeInTheDocument();
      });
    }
  });

  it('shows native share when available', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const nativeShareButton = screen.getByText('その他').closest('button');
    if (nativeShareButton) {
      fireEvent.click(nativeShareButton);
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    }
    
    delete (navigator as any).share;
  });

  it('handles native share error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockShare = jest.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const nativeShareButton = screen.getByText('その他').closest('button');
    if (nativeShareButton) {
      fireEvent.click(nativeShareButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Share failed:', expect.any(Error));
      });
    }
    
    consoleErrorSpy.mockRestore();
    delete (navigator as any).share;
  });
});