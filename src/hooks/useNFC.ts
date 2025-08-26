import { useState, useEffect, useCallback } from 'react';
import { 
  NFC_ERROR_MESSAGES,
  PRAIRIE_CARD_URL_PATTERN 
} from '@/constants/scanner';

interface UseNFCReturn {
  isSupported: boolean;
  isScanning: boolean;
  lastReadUrl: string | null;
  error: string | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
  clearError: () => void;
}

// TypeScript definitions are now in types/barcode.d.ts

export function useNFC(): UseNFCReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastReadUrl, setLastReadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    // Check if Web NFC API is supported
    // Web NFC is only available on Android Chrome/Edge with HTTPS
    if (window.NDEFReader) {
      setIsSupported(true);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError(NFC_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const ndef = new window.NDEFReader!();
      const controller = new AbortController();
      setAbortController(controller);

      await ndef.scan({ signal: controller.signal });

      ndef.addEventListener('reading', ({ message }: NDEFReadingEvent) => {
        console.log(`> NFC Message received from ${message.serialNumber}`);
        
        // Process NFC records
        for (const record of message.records) {
          console.log(`> Record type: ${record.recordType}`);
          console.log(`> Record data: ${record.data}`);
          
          // Handle text records
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            const text = textDecoder.decode(record.data);
            
            // Check if it's a Prairie Card URL
            if (text.includes('prairie.cards') || text.includes('prairie-cards')) {
              setLastReadUrl(text);
              setIsScanning(false);
              controller.abort();
              break;
            }
          }
          
          // Handle URL records
          if (record.recordType === 'url' || record.recordType === 'absolute-url') {
            const textDecoder = new TextDecoder();
            const url = textDecoder.decode(record.data);
            
            if (url.includes('prairie.cards') || url.includes('prairie-cards')) {
              setLastReadUrl(url);
              setIsScanning(false);
              controller.abort();
              break;
            }
          }

          // Handle NDEF records with URLs
          if (record.data) {
            try {
              const textDecoder = new TextDecoder();
              const data = textDecoder.decode(record.data);
              
              // Try to extract URL from the data
              const urlMatch = data.match(PRAIRIE_CARD_URL_PATTERN);
              if (urlMatch) {
                setLastReadUrl(urlMatch[0]);
                setIsScanning(false);
                controller.abort();
                break;
              }
            } catch (e) {
              console.error('Error decoding NFC data:', e);
            }
          }
        }
      });

      ndef.addEventListener('readingerror', () => {
        setError(NFC_ERROR_MESSAGES.READ_ERROR);
        setIsScanning(false);
      });

    } catch (err) {
      console.error('NFC Scan error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(NFC_ERROR_MESSAGES.PERMISSION_DENIED);
        } else if (err.name === 'NotSupportedError') {
          setError(NFC_ERROR_MESSAGES.NOT_SUPPORTED_BROWSER);
        } else if (err.name === 'AbortError') {
          // Scan was aborted, not an error
          console.log('NFC scan aborted');
        } else {
          setError(`${NFC_ERROR_MESSAGES.SCAN_FAILED}: ${err.message}`);
        }
      } else {
        setError(NFC_ERROR_MESSAGES.UNKNOWN);
      }
      
      setIsScanning(false);
    }
  }, [isSupported]);

  const stopScan = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsScanning(false);
  }, [abortController]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return {
    isSupported,
    isScanning,
    lastReadUrl,
    error,
    startScan,
    stopScan,
    clearError,
  };
}