import { useState, useRef, useCallback, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { 
  QR_SCAN_INTERVAL_MS, 
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
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  scannerType: 'barcodedetector' | 'qr-scanner' | 'none';
}

// Device and browser detection
function getDeviceInfo(): {
  isAndroid: boolean;
  isChrome: boolean;
  chromeVersion: number;
  isWebView: boolean;
  userAgent: string;
} {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edge|OPR/i.test(ua);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : 0;
  // Detect WebView by checking for specific indicators
  const isWebView = /wv|WebView/i.test(ua) || (isAndroid && /Version\/\d/.test(ua));
  
  return {
    isAndroid,
    isChrome,
    chromeVersion,
    isWebView,
    userAgent: ua
  };
}

// Check if BarcodeDetector is available and working
async function checkBarcodeDetectorSupport(): Promise<boolean> {
  try {
    // Check if API exists
    if (!('BarcodeDetector' in window)) {
      logger.debug('BarcodeDetector API not available');
      return false;
    }

    // Check if QR code format is supported
    const BarcodeDetectorClass = window.BarcodeDetector;
    if (!BarcodeDetectorClass) {
      return false;
    }
    
    const formats = await BarcodeDetectorClass.getSupportedFormats();
    if (!formats.includes('qr_code')) {
      logger.debug('QR code format not supported by BarcodeDetector');
      return false;
    }

    // Try to create an instance
    const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
    
    // Test with a dummy canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    await detector.detect(canvas);
    
    logger.debug('BarcodeDetector is available and working');
    return true;
  } catch (err) {
    logger.debug('BarcodeDetector check failed:', err);
    return false;
  }
}

export function useQRScannerV2(): UseQRScannerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [scannerType, setScannerType] = useState<'barcodedetector' | 'qr-scanner' | 'none'>('none');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);

  // Check camera support and permissions on mount
  useEffect(() => {
    async function checkSupport() {
      const deviceInfo = getDeviceInfo();
      logger.debug('Device info:', deviceInfo);

      // Check basic camera API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logger.error('Camera API not supported');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      // Check permission state if available
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
            logger.debug('Permission state changed to:', result.state);
          });
        } catch (err) {
          logger.debug('Cannot query camera permission:', err);
          setPermissionState('unknown');
        }
      }

      // Determine which scanner to use
      const hasBarcodeDetector = await checkBarcodeDetectorSupport();
      
      if (hasBarcodeDetector && !deviceInfo.isWebView) {
        // Use BarcodeDetector if available and not in WebView
        setScannerType('barcodedetector');
        logger.debug('Using BarcodeDetector API');
      } else {
        // Use qr-scanner library as fallback
        setScannerType('qr-scanner');
        logger.debug('Using qr-scanner library (fallback)');
      }
    }

    checkSupport();
  }, []);

  // QR detection using BarcodeDetector
  const detectWithBarcodeDetector = useCallback(async () => {
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
        if (!barcodeDetectorRef.current && window.BarcodeDetector) {
          barcodeDetectorRef.current = new window.BarcodeDetector({
            formats: ['qr_code']
          });
        }
        
        if (!barcodeDetectorRef.current) {
          throw new Error('BarcodeDetector not available');
        }
        
        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrCode = barcodes[0];
          const url = qrCode.rawValue;
          
          if (url && isPrairieCardUrl(url)) {
            logger.debug('QR code detected (BarcodeDetector):', url);
            setLastScannedUrl(url);
            stopScan();
            return;
          }
        }
      } catch (err) {
        logger.debug('BarcodeDetector detection error:', err);
      }
    }
    
    // Continue scanning
    if (isScanning) {
      scanTimeoutRef.current = setTimeout(detectWithBarcodeDetector, QR_SCAN_INTERVAL_MS);
    }
  }, [isScanning]);

  // Start scanning
  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError(CAMERA_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    const deviceInfo = getDeviceInfo();
    
    // Clear previous error and set scanning state
    setError(null);
    setIsScanning(true);

    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        const protocol = window.location.protocol;
        logger.error('Not in secure context. Protocol:', protocol);
        
        if (protocol === 'http:' && window.location.hostname !== 'localhost') {
          setError('HTTPSが必要です。https://でアクセスしてください。');
        } else {
          setError('セキュアな接続が必要です。');
        }
        setIsScanning(false);
        return;
      }

      // Special handling for Android WebView
      if (deviceInfo.isWebView) {
        logger.warn('Detected WebView environment');
        setError('WebViewでのカメラアクセスには、アプリ側の権限設定が必要です。アプリの設定でカメラ権限を許可してください。');
        setIsScanning(false);
        return;
      }

      logger.debug('Requesting camera access...');
      
      // Request camera with minimal constraints for better compatibility
      let stream: MediaStream;
      
      try {
        // Try simplest constraint first
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (err1) {
        logger.debug('Simple constraint failed, trying with facingMode');
        
        // Try with rear camera preference
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
        } catch (err2) {
          // Final attempt with old syntax
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          });
        }
      }

      logger.debug('Got camera stream successfully');
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;
        const timeout = setTimeout(() => reject(new Error('Video loading timeout')), 5000);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          logger.debug('Video metadata loaded');
          resolve();
        };
        
        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video playback error'));
        };
      });
      
      await videoRef.current.play();
      logger.debug('Video playback started');
      
      // Start QR detection based on scanner type
      if (scannerType === 'qr-scanner') {
        // Use qr-scanner library
        logger.debug('Starting qr-scanner detection');
        
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const url = result.data;
            if (url && isPrairieCardUrl(url)) {
              logger.debug('QR code detected (qr-scanner):', url);
              setLastScannedUrl(url);
              stopScan();
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5
          }
        );
        
        await qrScannerRef.current.start();
      } else if (scannerType === 'barcodedetector') {
        // Use BarcodeDetector API
        logger.debug('Starting BarcodeDetector detection');
        detectWithBarcodeDetector();
      }
      
    } catch (err) {
      const errorInfo = {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        deviceInfo: deviceInfo,
        scannerType: scannerType,
        permissionState: permissionState
      };
      
      logger.error('Camera access failed:', errorInfo);
      
      // Provide detailed error messages based on error type
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(`カメラ権限が拒否されました。

【解決方法】
1. アドレスバーの鍵アイコン🔒をタップ
2. 「権限」または「サイトの設定」を選択
3. 「カメラ」を「許可」に変更
4. ページを再読み込み

それでも解決しない場合：
Chrome設定 → サイトの設定 → カメラ → ブロック済みリストを確認`);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('カメラが他のアプリで使用中です。他のカメラアプリを閉じてから再試行してください。');
        } else if (err.name === 'SecurityError') {
          setError('セキュリティエラー：HTTPSでアクセスするか、カメラ権限を確認してください。');
        } else if (err.message.includes('timeout')) {
          setError('カメラの起動がタイムアウトしました。ページを再読み込みして再試行してください。');
        } else {
          setError(`カメラエラー: ${err.message}`);
        }
      } else {
        setError(CAMERA_ERROR_MESSAGES.GENERIC);
      }
      
      setIsScanning(false);
      
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isSupported, scannerType, permissionState, detectWithBarcodeDetector]);

  // Stop scanning
  const stopScan = useCallback(() => {
    logger.debug('Stopping QR scanner');
    setIsScanning(false);
    
    // Stop qr-scanner if active
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    // Clear BarcodeDetector
    barcodeDetectorRef.current = null;
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Cancel scan timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  // Clear error
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
    permissionState,
    scannerType,
  };
}