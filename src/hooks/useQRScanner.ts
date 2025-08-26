import { useState, useRef, useCallback, useEffect } from 'react';

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
  const animationFrameRef = useRef<number | null>(null);

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
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // Use the BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          });
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrCode = barcodes[0];
            const url = qrCode.rawValue;
            
            // Check if it's a Prairie Card URL
            if (url && (url.includes('prairie.cards') || url.includes('prairie-cards'))) {
              setLastScannedUrl(url);
              stopScan();
              return;
            }
          }
        }
      } catch (err) {
        console.log('QR detection error:', err);
      }
    }
    
    // Continue scanning
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode);
    }
  }, [isScanning]);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError('カメラアクセスがサポートされていません');
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
      console.error('Camera access error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('カメラへのアクセスが拒否されました。設定でカメラの権限を許可してください。');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('カメラが見つかりません。');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('カメラが他のアプリケーションで使用されています。');
        } else {
          setError(`カメラアクセスエラー: ${err.message}`);
        }
      } else {
        setError('カメラの起動に失敗しました');
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
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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