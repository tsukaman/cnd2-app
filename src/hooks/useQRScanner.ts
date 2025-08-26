import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  QR_SCAN_INTERVAL_MS, 
  QR_CAMERA_WIDTH_IDEAL,
  QR_CAMERA_HEIGHT_IDEAL,
  VIDEO_READY_STATE,
  CAMERA_ERROR_MESSAGES,
  isPrairieCardUrl
} from '@/constants/scanner';
import { logger } from '@/lib/logger';

interface UseQRScannerReturn {
  isSupported: boolean;
  isScanning: boolean;
  lastScannedUrl: string | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  clearError: () => void;
}

export function useQRScanner(): UseQRScannerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if camera API is supported
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsSupported(true);
    }
  }, []);

  const detectQRCode = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return;

    const video = videoRef.current;
    
    if (video.readyState === VIDEO_READY_STATE.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // Use the BarcodeDetector API if available
        if (window.BarcodeDetector) {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code']
          });
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrCode = barcodes[0];
            const url = qrCode.rawValue;
            
            // Check if it's a Prairie Card URL
            if (url && isPrairieCardUrl(url)) {
              setLastScannedUrl(url);
              // Stop scanning after successful detection
              setIsScanning(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
              }
              if (videoRef.current) {
                videoRef.current.srcObject = null;
              }
              return;
            }
          }
        }
      } catch (err) {
        logger.debug('QR detection error', err);
      }
    }
    
    // Continue scanning with frame rate control
    if (isScanning) {
      scanTimeoutRef.current = setTimeout(detectQRCode, QR_SCAN_INTERVAL_MS);
    }
  }, [isScanning]);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError(CAMERA_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: QR_CAMERA_WIDTH_IDEAL },
          height: { ideal: QR_CAMERA_HEIGHT_IDEAL }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start QR detection
        detectQRCode();
      }
    } catch (err) {
      logger.error('Camera access error', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(CAMERA_ERROR_MESSAGES.PERMISSION_DENIED);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(CAMERA_ERROR_MESSAGES.NOT_FOUND);
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError(CAMERA_ERROR_MESSAGES.IN_USE);
        } else {
          setError(`カメラアクセスエラー: ${err.message}`);
        }
      } else {
        setError(CAMERA_ERROR_MESSAGES.GENERIC);
      }
      
      setIsScanning(false);
    }
  }, [isSupported, detectQRCode]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Cancel scan timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return {
    isSupported,
    isScanning,
    lastScannedUrl,
    error,
    videoRef,
    startScan,
    stopScan,
    clearError,
  };
}