// Scanner configuration constants

// QR Scanner
export const QR_SCAN_INTERVAL_MS = 100; // Scan every 100ms for performance
export const QR_CAMERA_WIDTH_IDEAL = 1280;
export const QR_CAMERA_HEIGHT_IDEAL = 720;

// Video element states
export const VIDEO_READY_STATE = {
  HAVE_ENOUGH_DATA: 4
} as const;

// Prairie Card URL patterns
export const PRAIRIE_CARD_HOSTS = ['prairie.cards', 'my.prairie.cards'] as const;
export const PRAIRIE_CARD_URL_PATTERN = /https?:\/\/[^\s]+prairie[^\s]*/i;
// Prairie Card URL validation helper
export function isPrairieCardUrl(text: string): boolean {
  if (!text) return false;
  // Check if text contains prairie.cards or prairie-cards
  return text.includes('prairie.cards') || text.includes('prairie-cards');
}

export function extractPrairieCardUrl(text: string): string | null {
  const match = text.match(PRAIRIE_CARD_URL_PATTERN);
  return match ? match[0] : null;
}

// Error messages
export const CAMERA_ERROR_MESSAGES = {
  NOT_SUPPORTED: 'カメラアクセスがサポートされていません',
  PERMISSION_DENIED: 'カメラへのアクセスが拒否されました。設定でカメラの権限を許可してください。',
  NOT_FOUND: 'カメラが見つかりません。',
  IN_USE: 'カメラが他のアプリケーションで使用されています。',
  GENERIC: 'カメラの起動に失敗しました'
} as const;

export const NFC_ERROR_MESSAGES = {
  NOT_SUPPORTED: 'NFC is not supported on this device',
  PERMISSION_DENIED: 'NFC permission denied. Please enable NFC in your browser settings.',
  NOT_SUPPORTED_BROWSER: 'NFC is not supported on this device or browser.',
  SCAN_FAILED: 'NFC scan failed',
  READ_ERROR: 'Cannot read NFC tag. Please try again.',
  UNKNOWN: 'An unknown error occurred while scanning NFC'
} as const;