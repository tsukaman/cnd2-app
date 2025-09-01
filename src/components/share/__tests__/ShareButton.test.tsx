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

  it('shows share modal when clicked', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    // Modal header
    expect(screen.getAllByText('結果をシェア')[1]).toBeInTheDocument();
    // Share options in modal
    expect(screen.getByText('リンクをコピー')).toBeInTheDocument();
    expect(screen.getByText('QRコードを読み取って結果を確認')).toBeInTheDocument();
  });

  it('hides share modal when clicked outside', async () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    expect(screen.getByText('リンクをコピー')).toBeInTheDocument();
    
    // Click outside (on the backdrop)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('リンクをコピー')).not.toBeInTheDocument();
    });
  });

  it('has correct Twitter share link', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    // Find the Twitter/X link by its text content
    const twitterLink = screen.getByText('𝕏').closest('a');
    expect(twitterLink).toHaveAttribute('href', expect.stringContaining('https://twitter.com/intent/tweet'));
    expect(twitterLink).toHaveAttribute('target', '_blank');
  });

  it('has correct Facebook share link', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    // Find the Facebook link by its text content
    const facebookLink = screen.getByText('f').closest('a');
    expect(facebookLink).toHaveAttribute('href', expect.stringContaining('https://www.facebook.com/sharer'));
    expect(facebookLink).toHaveAttribute('target', '_blank');
  });

  it('has correct LINE share link', () => {
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    // Find the LINE link by its text content
    const lineLink = screen.getByText('L').closest('a');
    expect(lineLink).toHaveAttribute('href', expect.stringContaining('https://line.me/R/msg/text'));
    expect(lineLink).toHaveAttribute('target', '_blank');
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
    
    const copyButton = screen.getByText('リンクをコピー').closest('button');
    if (copyButton) {
      fireEvent.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/duo/results?id=test-123')
      );
      
      await waitFor(() => {
        expect(screen.getByText('コピーしました')).toBeInTheDocument();
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
    
    const nativeShareButton = screen.getByText('他のアプリでシェア').closest('button');
    if (nativeShareButton) {
      fireEvent.click(nativeShareButton);
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    }
    
    delete (navigator as { share?: unknown }).share;
  });

  it('handles native share error gracefully', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockShare = jest.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    
    render(<ShareButton {...defaultProps} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    const nativeShareButton = screen.getByText('他のアプリでシェア').closest('button');
    if (nativeShareButton) {
      fireEvent.click(nativeShareButton);
      
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Share cancelled or failed');
      });
    }
    
    consoleLogSpy.mockRestore();
    delete (navigator as { share?: unknown }).share;
  });
});