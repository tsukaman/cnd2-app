/**
 * Platform detection utilities
 */

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';
export type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'unknown';

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent) || 
      (platform.startsWith('mac') && 'ontouchend' in document)) {
    return 'ios';
  }
  
  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  // Desktop detection
  if (/windows|mac|linux/.test(platform) && !('ontouchend' in document)) {
    return 'desktop';
  }
  
  return 'unknown';
}

export function detectBrowser(): Browser {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Edge detection (must be before Chrome)
  if (userAgent.includes('edg/')) {
    return 'edge';
  }
  
  // Chrome detection
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'chrome';
  }
  
  // Firefox detection
  if (userAgent.includes('firefox')) {
    return 'firefox';
  }
  
  // Safari detection
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari';
  }
  
  return 'unknown';
}

export function isNFCSupported(): boolean {
  // NFC is only supported on Android Chrome/Edge
  const platform = detectPlatform();
  const browser = detectBrowser();
  
  return platform === 'android' && 
         (browser === 'chrome' || browser === 'edge') && 
         'NDEFReader' in window;
}

export function isQRScannerSupported(): boolean {
  // QR scanning requires camera access
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function isClipboardSupported(): boolean {
  // Clipboard API support
  return !!(navigator.clipboard && navigator.clipboard.readText);
}

export function getRecommendedInputMethod(): 'nfc' | 'qr' | 'clipboard' | 'manual' {
  if (isNFCSupported()) {
    return 'nfc';
  }
  
  if (isQRScannerSupported()) {
    return 'qr';
  }
  
  if (isClipboardSupported()) {
    return 'clipboard';
  }
  
  return 'manual';
}