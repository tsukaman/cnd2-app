import { useState, useEffect, useCallback } from 'react';
import { PRAIRIE_CARD_URL_PATTERN } from '@/constants/scanner';

interface UseClipboardPasteReturn {
  isSupported: boolean;
  lastPastedUrl: string | null;
  checkClipboard: () => Promise<void>;
  clearPastedUrl: () => void;
}

export function useClipboardPaste(): UseClipboardPasteReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [lastPastedUrl, setLastPastedUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if Clipboard API is supported
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      setIsSupported(true);
    }
  }, []);

  const isPrairieCardUrl = (text: string): boolean => {
    return text.includes('prairie.cards') || text.includes('prairie-cards');
  };

  const checkClipboard = useCallback(async () => {
    if (!isSupported) return;

    try {
      const text = await navigator.clipboard.readText();
      
      if (text && isPrairieCardUrl(text)) {
        // Extract URL from text (might contain other text)
        const urlMatch = text.match(/https?:\/\/[^\s]+prairie[^\s]*/i);
        if (urlMatch) {
          setLastPastedUrl(urlMatch[0]);
        }
      }
    } catch (err) {
      // Permission denied or other error
      console.log('Clipboard access denied or error:', err);
    }
  }, [isSupported]);

  const clearPastedUrl = useCallback(() => {
    setLastPastedUrl(null);
  }, []);

  // Listen for paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      
      if (text && isPrairieCardUrl(text)) {
        const urlMatch = text.match(PRAIRIE_CARD_URL_PATTERN);
        if (urlMatch) {
          setLastPastedUrl(urlMatch[0]);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  return {
    isSupported,
    lastPastedUrl,
    checkClipboard,
    clearPastedUrl,
  };
}