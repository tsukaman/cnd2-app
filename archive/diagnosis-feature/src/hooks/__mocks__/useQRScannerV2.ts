export function useQRScannerV2() {
  return {
    isSupported: false,
    isScanning: false,
    lastScannedUrl: null,
    error: null,
    videoRef: { current: null },
    startScan: jest.fn(),
    stopScan: jest.fn(),
    clearError: jest.fn(),
    permissionState: 'unknown' as const,
    scannerType: 'none' as const,
  };
}