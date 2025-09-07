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
    const startTime = Date.now();
    logger.debug('=== QR Scanner Start ===');
    
    if (!isSupported) {
      setError(CAMERA_ERROR_MESSAGES.NOT_SUPPORTED);
      return;
    }

    logger.debug('Device Info:', deviceInfo);
    
    // Clear previous error and set scanning state
    setError(null);
    setIsScanning(true);

    try {
      // Android Chrome特別処理: ユーザージェスチャーが失われる前にgetUserMediaを呼ぶ
      if (deviceInfo.isAndroid && deviceInfo.isChrome) {
        logger.debug('Android Chrome detected - calling getUserMedia immediately to preserve user gesture');
        
        try {
          // 即座にgetUserMediaを呼んでユーザージェスチャーを保持
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
          
          logger.debug('Got camera stream successfully on Android Chrome');
          streamRef.current = stream;
          
          // 成功したら、その後でチェックを実行（エラー表示のため）
          if (!window.isSecureContext) {
            logger.warn('Not in secure context but camera already granted');
          }
          
          // ビデオ要素の設定を続行
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
              logger.debug('Video metadata loaded');
              resolve();
            };
            
            video.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Video playback error'));
            };
          });
          
          await videoRef.current.play();
          logger.debug('Video playback started');
          
          // QR検出を開始
          if (scannerType === 'qr-scanner') {
            logger.debug('Starting qr-scanner detection');
            const QrScanner = (await import('qr-scanner')).default;
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
                highlightScanRegion: false,
                highlightCodeOutline: false,
              }
            );
            
            await qrScannerRef.current.start();
            logger.debug('qr-scanner started successfully');
          } else {
            logger.debug('Starting BarcodeDetector detection');
            detectWithBarcodeDetector();
          }
          
          return; // Android Chrome処理完了
        } catch (err) {
          // Android Chromeでエラーが発生した場合
          const elapsedTime = Date.now() - startTime;
          logger.error('Android Chrome camera access failed:', {
            name: (err as Error).name,
            message: (err as Error).message,
            elapsed: elapsedTime
          });
          
          if ((err as Error).name === 'NotAllowedError') {
            if (elapsedTime < DEBUG_CONSTANTS.QUICK_ERROR_THRESHOLD_MS) {
              setError('カメラアクセスが拒否されました。ブラウザの設定でカメラ権限を許可してください。');
            } else {
              setError('カメラ権限が拒否されました。');
            }
          } else {
            setError(`カメラエラー: ${(err as Error).message}`);
          }
          
          setIsScanning(false);
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
      logger.debug('Checking Permissions Policy...');
      if ('featurePolicy' in document) {
        const policy = (document as any).featurePolicy;
        if (policy && typeof policy.allowsFeature === 'function') {
          const cameraAllowed = policy.allowsFeature('camera');
          logger.debug('Feature Policy camera allowed:', cameraAllowed);
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
        logger.debug('Permissions Policy camera allowed:', cameraAllowed);
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
      logger.debug('Checking current permission state...');
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
          logger.debug('Current camera permission state:', permResult.state);
          
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
          logger.debug('Permission query failed:', permErr);
        }
      }

      const beforeGetUserMedia = Date.now();
      logger.debug(`Requesting camera access... (${beforeGetUserMedia - startTime}ms elapsed)`);
      
      // Request camera with minimal constraints for better compatibility
      let stream: MediaStream;
      
      try {
        // Log before getUserMedia call
        logger.debug('Calling getUserMedia with simple constraints...');
        
        // Try simplest constraint first
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        const afterGetUserMedia = Date.now();
        logger.debug(`getUserMedia succeeded (took ${afterGetUserMedia - beforeGetUserMedia}ms)`);
      } catch (err1) {
        const afterFirstAttempt = Date.now();
        logger.debug(`First getUserMedia failed after ${afterFirstAttempt - beforeGetUserMedia}ms:`, {
          name: (err1 as Error).name,
          message: (err1 as Error).message
        });
        
        // Try with rear camera preference
        try {
          logger.debug('Trying with facingMode constraint...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
          logger.debug('getUserMedia succeeded with facingMode');
        } catch (err2) {
          logger.debug('Second attempt failed:', {
            name: (err2 as Error).name,
            message: (err2 as Error).message
          });
          
          // Final attempt with old syntax
          logger.debug('Final attempt with basic facingMode...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          });
          logger.debug('getUserMedia succeeded with basic facingMode');
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
        const timeout = setTimeout(() => reject(new Error('Video loading timeout')), DEBUG_CONSTANTS.VIDEO_LOADING_TIMEOUT_MS);
        
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
      const elapsedTime = Date.now() - startTime;
      const errorInfo = {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        deviceInfo: deviceInfo,
        scannerType: scannerType,
        permissionState: permissionState,
        elapsedTime: `${elapsedTime}ms`,
        url: sanitizeUrl(window.location.href),
        isSecureContext: window.isSecureContext
      };
      
      logger.error('Camera access failed:', errorInfo);
      
      // Provide detailed error messages based on error type
      if (err instanceof Error) {
        // Log detailed debug info for development
        if (isDebugMode()) {
          console.group('🔴 QR Scanner Error Debug Info');
          console.log('Error Name:', err.name);
          console.log('Error Message:', err.message);
          console.log('Time to error:', `${elapsedTime}ms`);
          console.log('Device:', deviceInfo);
          console.log('URL:', window.location.href);
          console.log('Secure Context:', window.isSecureContext);
          console.log('Permission State:', permissionState);
          console.log('Stack:', err.stack);
          console.groupEnd();
        }
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          // Check if error happened too quickly (less than threshold)
          if (elapsedTime < DEBUG_CONSTANTS.QUICK_ERROR_THRESHOLD_MS) {
            logger.error('Permission denied too quickly - likely blocked by browser/policy');
            setError(`カメラアクセスがブラウザによってブロックされています。

【考えられる原因】
• サイトがカメラ権限のブラックリストに入っている
• ブラウザのポリシーによるブロック
• Cloudflare Pagesのドメイン制限

【解決方法】
1. URLを直接入力するか貼付ボタンを使用
2. 別のブラウザで試す（Firefox、Edge等）
3. Chrome設定をリセット:
   設定 → プライバシーとセキュリティ → 
   サイトの設定 → すべての権限をリセット

【デバッグ情報】
エラー発生時間: ${elapsedTime}ms
デバイス: ${deviceInfo.isAndroid ? 'Android' : 'その他'}
Chrome: ${deviceInfo.chromeVersion}`);
          } else {
            setError(`カメラ権限が拒否されました。

【解決方法】
1. アドレスバーの鍵アイコン🔒をタップ
2. 「権限」または「サイトの設定」を選択
3. 「カメラ」を「許可」に変更
4. ページを再読み込み

それでも解決しない場合：
Chrome設定 → サイトの設定 → カメラ → ブロック済みリストを確認`);
          }
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('カメラが他のアプリで使用中です。他のカメラアプリを閉じてから再試行してください。');
        } else if (err.name === 'SecurityError') {
          setError('セキュリティエラー：HTTPSでアクセスするか、カメラ権限を確認してください。');
        } else if (err.name === 'TypeError' && err.message.includes('getUserMedia')) {
          setError(`ブラウザがカメラAPIをサポートしていません。

Chrome最新版へのアップデートをお試しください。
現在のバージョン: Chrome/${deviceInfo.chromeVersion}`);
        } else if (err.message.includes('timeout')) {
          setError('カメラの起動がタイムアウトしました。ページを再読み込みして再試行してください。');
        } else {
          setError(`カメラエラー: ${err.message}

【デバッグ情報】
エラー: ${err.name}
時間: ${elapsedTime}ms`);
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
  }, [isSupported, scannerType, permissionState, detectWithBarcodeDetector, deviceInfo]);

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