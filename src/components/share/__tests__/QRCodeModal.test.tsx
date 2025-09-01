import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QRCodeModal } from '../QRCodeModal';
import QRCode from 'qrcode';

jest.mock('qrcode');

describe('QRCodeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    resultId: 'test-123',
    score: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,test');
  });

  it('does not render when closed', () => {
    render(<QRCodeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('診断結果をシェア')).not.toBeInTheDocument();
  });

  it('renders when open', async () => {
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('診断結果をシェア')).toBeInTheDocument();
    });
  });

  it('generates QR code with correct URL', async () => {
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('/duo/results?id=test-123'),
        expect.objectContaining({
          width: 300,
          margin: 2,
          color: {
            dark: '#1E1B4B',
            light: '#FFFFFF',
          },
        })
      );
    });
  });

  it('displays the result URL', async () => {
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('/duo/results?id=test-123');
      })).toBeInTheDocument();
    });
  });

  it('closes when backdrop is clicked', async () => {
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      const backdrop = document.querySelector('.bg-black\\/80');
      if (backdrop) {
        act(() => {
          fireEvent.click(backdrop);
        });
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });
  });

  it('closes when X button is clicked', async () => {
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('downloads QR code when download button is clicked', async () => {
    // Mock createElement and click
    const mockClick = jest.fn();
    const originalCreateElement = document.createElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        const element = originalCreateElement.call(document, tagName);
        element.click = mockClick;
        return element;
      }
      return originalCreateElement.call(document, tagName);
    });
    
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('QRコード保存')).toBeInTheDocument();
    });
    
    const downloadButton = screen.getByText('QRコード保存').closest('button');
    if (downloadButton) {
      fireEvent.click(downloadButton);
      expect(mockClick).toHaveBeenCalled();
    }
    
    jest.restoreAllMocks();
  });

  it('does not show share button when navigator.share is not available', async () => {
    const originalShare = navigator.share;
    // Delete the share property entirely
    delete (navigator as any).share;
    
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('共有')).not.toBeInTheDocument();
    });
    
    // Restore the original share if it existed
    if (originalShare) {
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        writable: true,
      });
    }
  });

  it('shares QR code when share button is clicked and navigator.share is available', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
    
    render(<QRCodeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('共有')).toBeInTheDocument();
    });
    
    const shareButton = screen.getByText('共有').closest('button');
    if (shareButton) {
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    }
    
    delete (navigator as any).share;
  });
});