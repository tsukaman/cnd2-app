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

// Debug helper for Android issues
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua);
  const version = ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
  return `Android: ${isAndroid}, Chrome: ${isChrome}, Version: ${version}`;
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
      logger.debug('Camera API supported. Device info:', getDeviceInfo());
    } else {
      logger.error('Camera API not supported. Device info:', getDeviceInfo());
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

    // Clear previous error and set scanning state
    setError(null);
    setIsScanning(true);

    try {
      // Check if we're in a secure context (required for camera access)
      if (!window.isSecureContext) {
        logger.error('Not in secure context. Protocol:', window.location.protocol);
        setError('HTTPSが必要です。安全な接続でアクセスしてください。');
        setIsScanning(false);
        return;
      }

      logger.debug('Starting camera access request...');
      
      // For Android, start with the simplest possible constraints
      // and add complexity only if needed
      let stream: MediaStream | null = null;
      
      // First attempt: Most basic request (works on most Android devices)
      try {
        logger.debug('Attempt 1: Basic video request');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        logger.debug('Success with basic video request');
      } catch (basicErr) {
        logger.debug('Basic request failed, trying with facingMode', basicErr);
        
        // Second attempt: Add facingMode as ideal (not exact)
        try {
          logger.debug('Attempt 2: With ideal facingMode');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' }
            }
          });
          logger.debug('Success with ideal facingMode');
        } catch (facingErr) {
          logger.debug('FacingMode request failed, trying with string facingMode', facingErr);
          
          // Third attempt: Older syntax that some Android devices prefer
          try {
            logger.debug('Attempt 3: With string facingMode');
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment'
              }
            });
            logger.debug('Success with string facingMode');
          } catch (finalErr) {
            // All attempts failed, throw the final error
            throw finalErr;
          }
        }
      }

      if (!stream) {
        throw new Error('Failed to get media stream');
      }

      logger.debug('Got media stream successfully');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const video = videoRef.current;
          
          // Set up event handlers
          video.onloadedmetadata = () => {
            logger.debug('Video metadata loaded');
            resolve();
          };
          
          video.onerror = (e) => {
            logger.error('Video error:', e);
            reject(new Error('Video playback error'));
          };
          
          // Timeout after 5 seconds
          setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 5000);
        });
        
        await videoRef.current.play();
        logger.debug('Video playback started successfully');
        
        // Start QR detection
        detectQRCode();
      }
    } catch (err) {
      // Detailed error logging
      const errorDetails = {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        deviceInfo: getDeviceInfo(),
        secureContext: window.isSecureContext,
        protocol: window.location.protocol
      };
      
      logger.error('Camera access failed:', errorDetails);
      
      if (err instanceof Error) {
        // Handle specific error types
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          // Most common on Android when permission is denied
          setError('カメラへのアクセスが拒否されました。ブラウザの設定でこのサイトのカメラ権限を許可してください。');
        } else if (err.name === 'SecurityError') {
          // Can occur on insecure contexts or permission issues
          if (err.message.toLowerCase().includes('permission')) {
            setError('カメラ権限が必要です。ブラウザの設定を確認してください。');
          } else {
            setError('セキュリティエラー：HTTPSでアクセスしてください。');
          }
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('カメラが他のアプリで使用中です。他のアプリを閉じてから再試行してください。');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          setError('カメラの設定に問題があります。別のブラウザで試してください。');
        } else if (err.name === 'TypeError') {
          setError('ブラウザがカメラアクセスをサポートしていません。');
        } else if (err.message.includes('timeout')) {
          setError('カメラの起動がタイムアウトしました。再試行してください。');
        } else {
          setError(`カメラエラー: ${err.message}`);
        }
      } else {
        setError(CAMERA_ERROR_MESSAGES.GENERIC);
      }
      
      setIsScanning(false);
      
      // Clean up any partial stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
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