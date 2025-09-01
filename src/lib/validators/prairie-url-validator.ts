/**
 * Prairie Card URL検証ユーティリティ
 * セキュリティ強化のため、HTTPSプロトコルのみを許可し、
 * 承認されたドメインのみを受け入れる
 */

// Prairie Cardの公式ドメイン
const ALLOWED_PRAIRIE_HOSTS = new Set([
  'prairie.cards',
  'my.prairie.cards'
]);

// Prairie Cardのサブドメインパターン
const PRAIRIE_SUBDOMAIN_PATTERN = /^[a-z0-9-]+\.prairie\.cards$/;

export interface PrairieUrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Prairie Card URLの厳密な検証
 * @param url 検証対象のURL
 * @returns 検証結果
 */
export function validatePrairieCardUrl(url: string): PrairieUrlValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URLが指定されていません'
    };
  }

  try {
    const parsed = new URL(url.trim());
    
    // 1. HTTPSプロトコルの強制
    // セキュリティのため、HTTPSのみを許可
    if (parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: `セキュリティのため、HTTPSプロトコルのみ対応しています。現在のプロトコル: ${parsed.protocol}`
      };
    }
    
    // 2. ポート番号の検証
    // 標準ポート（443）以外は拒否
    if (parsed.port && parsed.port !== '443') {
      return {
        isValid: false,
        error: `標準ポート以外は許可されていません。ポート: ${parsed.port}`
      };
    }
    
    // 3. ホスト名の検証
    const hostname = parsed.hostname.toLowerCase();
    
    // 承認されたドメインリストに含まれるか確認
    const isAllowedHost = ALLOWED_PRAIRIE_HOSTS.has(hostname);
    
    // サブドメインパターンに一致するか確認
    const isValidSubdomain = PRAIRIE_SUBDOMAIN_PATTERN.test(hostname);
    
    // ドメインが .prairie.cards で終わるか確認（追加の安全性）
    const isValidDomainSuffix = hostname.endsWith('.prairie.cards');
    
    if (!isAllowedHost && !isValidSubdomain && !isValidDomainSuffix) {
      return {
        isValid: false,
        error: `Prairie Cardの公式ドメインではありません: ${hostname}`
      };
    }
    
    // 4. パスの基本検証
    // 危険な文字列が含まれていないか確認
    // 元のURL文字列でチェック（URLパーサーは自動的に正規化するため）
    if (url.includes('../') || url.includes('..\\') || parsed.pathname.includes('//')) {
      return {
        isValid: false,
        error: '不正なパスが含まれています'
      };
    }
    
    // 5. クエリパラメータの検証（オプション）
    // 潜在的に危険なパラメータがないか確認
    const dangerousParams = ['javascript:', 'data:', 'vbscript:'];
    const searchParams = parsed.search.toLowerCase();
    for (const dangerous of dangerousParams) {
      if (searchParams.includes(dangerous)) {
        return {
          isValid: false,
          error: '不正なクエリパラメータが含まれています'
        };
      }
    }
    
    // URLの正規化（末尾のスラッシュを除去）
    const normalizedUrl = parsed.href.replace(/\/$/, '');
    
    return {
      isValid: true,
      normalizedUrl
    };
    
  } catch (error) {
    // URL解析エラー
    return {
      isValid: false,
      error: `無効なURL形式です: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

/**
 * 複数のPrairie Card URLを一括検証
 * @param urls 検証対象のURL配列
 * @returns 全てのURLが有効な場合true
 */
export function validateMultiplePrairieUrls(urls: string[]): {
  allValid: boolean;
  results: PrairieUrlValidationResult[];
  errors: string[];
} {
  const results = urls.map(url => validatePrairieCardUrl(url));
  const errors = results
    .filter(r => !r.isValid)
    .map(r => r.error || '不明なエラー');
  
  return {
    allValid: results.every(r => r.isValid),
    results,
    errors
  };
}

/**
 * Prairie Card URLかどうかの簡易チェック
 * （パフォーマンス重視の場合に使用）
 * @param url チェック対象のURL
 * @returns Prairie Card URLの場合true
 */
export function isPrairieCardUrl(url: string): boolean {
  try {
    const result = validatePrairieCardUrl(url);
    return result.isValid;
  } catch {
    return false;
  }
}