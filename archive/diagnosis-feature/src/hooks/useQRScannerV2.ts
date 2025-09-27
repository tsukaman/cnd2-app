import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import QrScanner from 'qr-scanner';
import { 
  QR_SCAN_INTERVAL_MS, 
  VIDEO_READY_STATE,
  CAMERA_ERROR_MESSAGES,
  isPrairieCardUrl
} from '@/constants/scanner';
import { 
  DEBUG_CONSTANTS, 
  isDebugMode, 
  sanitizeUrl 
} from '@/constants/debug';
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
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') {
    return {
      isAndroid: false,
      isChrome: false,
      chromeVersion: 0,
      isWebView: false,
      userAgent: ''
    };
  }
  
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
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if API exists
    if (!('BarcodeDetector' in window)) {
      return false;
    }

    // Check if QR code format is supported
    const BarcodeDetectorClass = window.BarcodeDetector;
    if (!BarcodeDetectorClass) {
      return false;
    }
    
    const formats = await BarcodeDetectorClass.getSupportedFormats();
    if (!formats.includes('qr_code')) {
      return false;
    }

    // Try to create an instance
    const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
    
    // Test with a dummy canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    await detector.detect(canvas);
    
    return true;
  } catch (err) {
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
  
  // Memoize device info for performance
  const deviceInfo = useMemo(() => getDeviceInfo(), []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);

  // Check camera support and permissions on mount
  useEffect(() => {
    async function checkSupport() {

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
          });
        } catch (err) {
          setPermissionState('unknown');
        }
      }

      // Determine which scanner to use
      const hasBarcodeDetector = await checkBarcodeDetectorSupport();
      
      if (hasBarcodeDetector && !deviceInfo.isWebView) {
        // Use BarcodeDetector if available and not in WebView
        setScannerType('barcodedetector');
      } else {
        // Use qr-scanner library as fallback
        setScannerType('qr-scanner');
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
            setLastScannedUrl(url);
            stopScan();
            return;
          }
        }
      } catch (err) {
      }
    }
    
    // Continue scanning
    if (isScanning) {
      scanTimeoutRef.current = setTimeout(detectWithBarcodeDetector, QR_SCAN_INTERVAL_MS);
    }
  }, [isScanning]);

  // Stop scanning - Define before other functions that use it
  const stopScan = useCallback(() => {
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

  // Handle Android Chrome camera access
  const handleAndroidChromeCamera = useCallback(async (): Promise<MediaStream | null> => {
    
    try {
      // 即座にgetUserMediaを呼んでユーザージェスチャーを保持
      // まず背面カメラを試みる
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },  // 背面カメラを指定
          audio: false
        });
        return stream;
      } catch (err1) {
        // 背面カメラが失敗した場合は、どのカメラでも受け入れる
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,  // フォールバック：利用可能な任意のカメラ
          audio: false
        });
        return stream;
      }
    } catch (err) {
      logger.error('Android Chrome camera access failed:', err);
      throw err;
    }
  }, []);

  // Setup video stream and start QR detection
  const setupVideoAndStartDetection = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;
    
    if (!videoRef.current) {
      throw new Error('Video element not found');
    }
    
    videoRef.current.srcObject = stream;
    
    // ビデオの準備を待つ
    await new Promise<void>((resolve, reject) => {
      const video = videoRef.current!;
      const timeout = setTimeout(() => reject(new Error('Video loading timeout')), DEBUG_CONSTANTS.VIDEO_LOADING_TIMEOUT_MS);
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Video playback error'));
      };
    });
    
    await videoRef.current.play();
    
    // QR検出を開始
    if (scannerType === 'qr-scanner') {
      const QrScanner = (await import('qr-scanner')).default;
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const url = result.data;
          if (url && isPrairieCardUrl(url)) {
            setLastScannedUrl(url);
            stopScan();
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
        }
      );
      
      await qrScannerRef.current.start();
    } else {
      detectWithBarcodeDetector();
    }
  }, [scannerType, detectWithBarcodeDetector, stopScan]);

  // Handle camera access error
  const handleCameraError = useCallback((err: Error, startTime: number) => {
    const elapsedTime = Date.now() - startTime;
    logger.error('Camera access failed:', {
      name: err.name,
      message: err.message,
      elapsed: elapsedTime,
      deviceInfo,
      isAndroidChrome: deviceInfo.isAndroid && deviceInfo.isChrome
    });
    
    if (err.name === 'NotAllowedError') {
      if (elapsedTime < DEBUG_CONSTANTS.QUICK_ERROR_THRESHOLD_MS) {
        // Android Chromeの場合、より詳細なエラーメッセージ
        if (deviceInfo.isAndroid && deviceInfo.isChrome) {
          setError(`カメラアクセスが即座に拒否されました（${elapsedTime}ms）。
          
設定を確認してください：
1. Chromeアプリの設定でカメラ権限を許可
2. Androidシステム設定でChromeのカメラ権限を許可
3. サイトの設定でカメラをブロックしていないか確認

デバッグ情報：
- エラー時間: ${elapsedTime}ms
- Chrome: v${deviceInfo.chromeVersion}`);
        } else {
          setError('カメラアクセスが拒否されました。ブラウザの設定でカメラ権限を許可してください。');
        }
      } else {
        setError('カメラ権限が拒否されました。');
      }
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      setError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      setError('カメラが他のアプリで使用中です。他のカメラアプリを閉じてから再試行してください。');
    } else {
      setError(`カメラエラー: ${err.message}`);
    }
    
    setIsScanning(false);
  }, [deviceInfo]);

  // Start scanning
  const startScan = useCallback(async () => {
    const startTime = Date.now();
    
    if (!isSupported) {
      setError(CAMERA_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    
    // Clear previous error and set scanning state
    setError(null);
    setIsScanning(true);

    try {
      // Android Chrome特別処理: ユーザージェスチャーが失われる前にgetUserMediaを呼ぶ
      if (deviceInfo.isAndroid && deviceInfo.isChrome) {
        try {
          const stream = await handleAndroidChromeCamera();
          if (stream) {
            await setupVideoAndStartDetection(stream);
            return; // Android Chrome処理完了
          }
        } catch (err) {
          handleCameraError(err as Error, startTime);
          return;
        }
      }
      
      // Android Chrome以外の通常処理
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        logger.error('Not in secure context', { protocol, hostname });
        
        if (protocol === 'http:' && hostname !== 'localhost') {
          setError('HTTPSが必要です。https://でアクセスしてください。');
        } else {
          setError('セキュアな接続が必要です。');
        }
        setIsScanning(false);
        return;
      }

      // Check Permissions Policy (Feature Policy)
      if ('featurePolicy' in document) {
        const policy = (document as any).featurePolicy;
        if (policy && typeof policy.allowsFeature === 'function') {
          const cameraAllowed = policy.allowsFeature('camera');
          if (!cameraAllowed) {
            logger.error('Camera blocked by Feature Policy');
            setError('このサイトではカメラ機能がブロックされています。管理者にお問い合わせください。');
            setIsScanning(false);
            return;
          }
        }
      }

      // Check Permissions Policy (newer API)
      if ('permissions' in document && typeof (document as any).permissions?.policy?.allowsFeature === 'function') {
        const policy = (document as any).permissions.policy;
        const cameraAllowed = policy.allowsFeature('camera');
        if (!cameraAllowed) {
          logger.error('Camera blocked by Permissions Policy');
          setError('このサイトではカメラ機能がブロックされています。管理者にお問い合わせください。');
          setIsScanning(false);
          return;
        }
      }

      // Special handling for Android WebView
      if (deviceInfo.isWebView) {
        logger.warn('Detected WebView environment');
        setError('WebViewでのカメラアクセスには、アプリ側の権限設定が必要です。アプリの設定でカメラ権限を許可してください。');
        setIsScanning(false);
        return;
      }

      // Check current permission state before requesting
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permResult.state === 'denied') {
            logger.error('Camera permission is already denied');
            setError(`カメラ権限が拒否されています。

【解決方法】
1. Chromeの設定を開く（⋮ → 設定）
2. 「サイトの設定」を選択
3. 「カメラ」を選択
4. ブロック済みリストからこのサイトを削除
5. ページを再読み込み`);
            setIsScanning(false);
            return;
          }
        } catch (permErr) {
        }
      }

      const beforeGetUserMedia = Date.now();
      
      // Request camera with minimal constraints for better compatibility
      let stream: MediaStream;
      
      try {
        // Log before getUserMedia call
        
        // Try simplest constraint first
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        const afterGetUserMedia = Date.now();
      } catch (err1) {
        const afterFirstAttempt = Date.now();
        
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

      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;
        const timeout = setTimeout(() => reject(new Error('Video loading timeout')), DEBUG_CONSTANTS.VIDEO_LOADING_TIMEOUT_MS);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video playback error'));
        };
      });
      
      await videoRef.current.play();
      
      // Start QR detection based on scanner type
      if (scannerType === 'qr-scanner') {
        // Use qr-scanner library
        
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const url = result.data;
            if (url && isPrairieCardUrl(url)) {
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
        detectWithBarcodeDetector();
      }
      
    } catch (err) {
      // Use unified error handler
      handleCameraError(err as Error, startTime);
    }
  }, [isSupported, scannerType, permissionState, detectWithBarcodeDetector, deviceInfo, handleAndroidChromeCamera, setupVideoAndStartDetection, handleCameraError, stopScan]);

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