import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  isPrairieCardUrl as isPrairieCardUrlHelper,
  extractPrairieCardUrl
} from '@/constants/scanner';
import { logger } from '@/lib/logger';

interface UseClipboardPasteReturn {
  isSupported: boolean;
  lastPastedUrl: string | null;
  checkClipboard: () => Promise<void>;
  clearPastedUrl: () => void;
}

export function useClipboardPaste(): UseClipboardPasteReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [lastPastedUrl, setLastPastedUrl] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Disable auto-detection on results pages
  const isResultsPage = pathname?.includes('/results') || false;

  useEffect(() => {
    // Check if Clipboard API is supported (but disabled on results pages)
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function' && !isResultsPage) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, [isResultsPage]);

  const isPrairieCardUrl = (text: string): boolean => {
    return isPrairieCardUrlHelper(text);
  };

  const checkClipboard = useCallback(async () => {
    if (!isSupported) return;

    try {
      const text = await navigator.clipboard.readText();
      
      if (text && isPrairieCardUrl(text)) {
        // Extract URL from text (might contain other text)
        const url = extractPrairieCardUrl(text);
        if (url) {
          setLastPastedUrl(url);
        }
      }
    } catch (err) {
      // Permission denied or other error
      logger.debug('Clipboard access denied or error', err);
    }
  }, [isSupported]);

  const clearPastedUrl = useCallback(() => {
    setLastPastedUrl(null);
  }, []);

  // Listen for paste events (disabled on results pages)
  useEffect(() => {
    if (isResultsPage) return;
    
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      
      if (text && isPrairieCardUrl(text)) {
        const url = extractPrairieCardUrl(text);
        if (url) {
          setLastPastedUrl(url);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isResultsPage]);

  return {
    isSupported,
    lastPastedUrl,
    checkClipboard,
    clearPastedUrl,
  };
}