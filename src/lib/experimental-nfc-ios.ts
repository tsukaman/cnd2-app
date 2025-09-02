/**
 * iOS NFC実験的対応
 * 注意：これらのAPIは現在iOSでは利用できません
 * 将来的な対応のための参考実装
 */

// 1. 将来的にWebKitがサポートする可能性のあるAPI
export function checkFutureIOSNFCSupport(): boolean {
  // WebKit独自のNFC API（現在は存在しない）
  const webkitWindow = window as { webkit?: { nfc?: unknown } };
  if ('webkit' in window && webkitWindow.webkit && 'nfc' in webkitWindow.webkit) {
    console.log('WebKit NFC API detected (future)');
    return true;
  }
  
  // iOS 17+ での実験的API（仮想）
  if ('NFCNDEFReaderSession' in window) {
    console.log('iOS NFCNDEFReaderSession detected');
    return true;
  }
  
  return false;
}

// 2. アプリ内ブラウザでの可能性
export function checkInAppBrowserNFC(): boolean {
  const userAgent = navigator.userAgent;
  
  // LINE, Slack等のアプリ内ブラウザ
  const inAppBrowsers = [
    'Line/',      // LINE
    'FB_IAB',     // Facebook
    'Instagram',  // Instagram
    'Twitter',    // Twitter/X
    'Slack'       // Slack
  ];
  
  const isInAppBrowser = inAppBrowsers.some(app => 
    userAgent.includes(app)
  );
  
  if (isInAppBrowser) {
    // アプリ内ブラウザでも結局WebKitベースなので動作しない
    console.log('In-app browser detected, but NFC still not available');
  }
  
  return false;
}

// 3. PWA（Progressive Web App）としてインストールした場合
export function checkPWANFCSupport(): boolean {
  // スタンドアロンモードでの実行確認
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as { standalone?: boolean }).standalone === true;
  
  if (isStandalone) {
    console.log('PWA mode detected');
    // PWAでもWebKitの制限は変わらない
    if ('NDEFReader' in window) {
      return true;
    }
  }
  
  return false;
}

// 4. Universal Linksを使った回避策
export function generateUniversalLink(prairieUrl: string): string {
  // iOS Shortcutsアプリへのディープリンク生成
  // shortcuts://run-shortcut?name=CND2%20NFC&input=text&text={url}
  const encodedUrl = encodeURIComponent(prairieUrl);
  return `shortcuts://run-shortcut?name=CND2%20NFC&input=text&text=${encodedUrl}`;
}

// 5. カスタムURLスキーム（ネイティブアプリが必要）
export function generateCustomScheme(prairieUrl: string): string {
  // 仮想的なネイティブアプリのURLスキーム
  // cnd2://scan-nfc?callback_url={encoded_url}
  const encodedUrl = encodeURIComponent(prairieUrl);
  return `cnd2://scan-nfc?callback_url=${encodedUrl}`;
}

// 6. 総合チェック関数
export function checkAllIOSNFCPossibilities(): {
  webNFC: boolean;
  futureAPI: boolean;
  inAppBrowser: boolean;
  pwa: boolean;
  message: string;
} {
  const result = {
    webNFC: 'NDEFReader' in window,
    futureAPI: checkFutureIOSNFCSupport(),
    inAppBrowser: checkInAppBrowserNFC(),
    pwa: checkPWANFCSupport(),
    message: ''
  };
  
  if (result.webNFC) {
    result.message = 'Web NFC APIが利用可能です';
  } else if (result.futureAPI) {
    result.message = '将来的なiOS NFC APIが検出されました';
  } else if (result.pwa) {
    result.message = 'PWAモードですが、NFCは利用できません';
  } else {
    result.message = 'iOSではNFCをブラウザから直接利用できません。QRコードをご利用ください。';
  }
  
  return result;
}