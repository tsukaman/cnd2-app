"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { usePrairieCard } from "@/hooks/usePrairieCard";
import { useNFC } from "@/hooks/useNFC";
import { useQRScanner } from "@/hooks/useQRScanner";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { PrairieProfile } from "@/types";
import { detectPlatform } from "@/lib/platform";
import { Loader2, Check, AlertCircle, User, Smartphone, X, QrCode, Clipboard, Camera } from "lucide-react";

interface PrairieCardInputProps {
  onProfileLoaded: (profile: PrairieProfile) => void;
  placeholder?: string;
  label?: string;
}

export default function PrairieCardInput({ 
  onProfileLoaded, 
  placeholder = "https://my.prairie.cards/u/username",
  label = "Prairie Card URL"
}: PrairieCardInputProps) {
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [platform] = useState(() => detectPlatform());
  const [inputMethod, setInputMethod] = useState<'manual' | 'nfc' | 'qr' | 'clipboard'>('manual');
  
  const { 
    loading, 
    error, 
    profile, 
    retryAttempt, 
    isRetrying, 
    fetchProfile, 
    clearError, 
    useSampleData 
  } = usePrairieCard();
  
  // NFC Hook (Android only)
  const { 
    isSupported: nfcSupported, 
    isScanning: nfcScanning, 
    lastReadUrl: nfcUrl, 
    error: nfcError, 
    startScan: startNFC, 
    stopScan: stopNFC,
    clearError: clearNFCError 
  } = useNFC();
  
  // QR Scanner Hook
  const {
    isSupported: qrSupported,
    isScanning: qrScanning,
    lastScannedUrl: qrUrl,
    error: qrError,
    videoRef,
    startScan: startQR,
    stopScan: stopQR,
    clearError: clearQRError
  } = useQRScanner();
  
  // Clipboard Hook
  const {
    isSupported: clipboardSupported,
    lastPastedUrl: pastedUrl,
    checkClipboard,
    clearPastedUrl
  } = useClipboardPaste();
  
  // Handle pasted URL
  const handleFetchProfile = useCallback(async (profileUrl: string) => {
    if (!profileUrl.trim()) {
      setIsValid(false);
      return;
    }

    const result = await fetchProfile(profileUrl);
    if (result) {
      setIsValid(true);
      onProfileLoaded(result);
      // 成功したらURLをクリア
      setTimeout(() => {
        setUrl("");
        setIsValid(null);
      }, 2000);
    } else {
      setIsValid(false);
    }
  }, [fetchProfile, onProfileLoaded]);
  
  // Handle NFC URL when read
  useEffect(() => {
    if (nfcUrl) {
      setUrl(nfcUrl);
      handleFetchProfile(nfcUrl);
    }
  }, [nfcUrl, handleFetchProfile]);
  
  // Handle QR URL when scanned
  useEffect(() => {
    if (qrUrl) {
      setUrl(qrUrl);
      handleFetchProfile(qrUrl);
      setInputMethod('manual');
    }
  }, [qrUrl, handleFetchProfile]);

  useEffect(() => {
    if (pastedUrl && !url) {
      setUrl(pastedUrl);
      // Show confirmation before auto-loading with URL sanitization
      const sanitizedUrl = pastedUrl.length > 100 
        ? pastedUrl.substring(0, 100) + '...' 
        : pastedUrl;
      const shouldLoad = window.confirm(`Prairie Card URLを検出しました:\n${sanitizedUrl}\n\n読み込みますか？`);
      if (shouldLoad) {
        handleFetchProfile(pastedUrl);
      }
      clearPastedUrl();
    }
  }, [pastedUrl, handleFetchProfile, clearPastedUrl, url]);

  // Cleanup on unmount - ensure QR scanner is stopped
  useEffect(() => {
    return () => {
      if (qrScanning) {
        stopQR();
      }
    };
  }, [qrScanning, stopQR]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFetchProfile(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setIsValid(null);
    if (error) clearError();
    if (nfcError) clearNFCError();
    if (qrError) clearQRError();
  };

  const handleNFCScan = async () => {
    if (nfcScanning) {
      stopNFC();
    } else {
      await startNFC();
    }
  };
  
  const handleQRScan = async () => {
    if (qrScanning) {
      stopQR();
      setInputMethod('manual');
    } else {
      setInputMethod('qr');
      await startQR();
    }
  };
  
  const handleClipboardPaste = async () => {
    await checkClipboard();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              {label}
            </label>
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
              {/* Platform detection status (debug) */}
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500 mr-2">
                  Platform: {platform}
                </span>
              )}
              
              {/* NFC Button (Android only) */}
              {nfcSupported && platform === 'android' && (
                <motion.button
                  type="button"
                  onClick={handleNFCScan}
                  className={`
                    flex items-center gap-1 sm:gap-1.5 px-2 py-2 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium
                    transition-all duration-300 min-h-[44px] sm:min-h-0 whitespace-nowrap flex-shrink-0
                    ${nfcScanning 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="NFCタグを読み取る"
                >
                  <Smartphone className={`w-4 h-4 ${nfcScanning ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">NFC</span>
                  <span className="sm:hidden">NFC</span>
                </motion.button>
              )}
              
              {/* QR Code Button (iOS and Android) */}
              {qrSupported && (platform === 'ios' || platform === 'android') && (
                <motion.button
                  type="button"
                  onClick={handleQRScan}
                  className={`
                    flex items-center gap-1 sm:gap-1.5 px-2 py-2 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium
                    transition-all duration-300 min-h-[44px] sm:min-h-0 whitespace-nowrap flex-shrink-0
                    ${qrScanning || inputMethod === 'qr'
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="QRコードを読み取る"
                >
                  <QrCode className={`w-4 h-4 ${qrScanning ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">QR</span>
                  <span className="sm:hidden">QR</span>
                </motion.button>
              )}
              
              {/* Clipboard Button (All platforms) */}
              {clipboardSupported && (
                <motion.button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 py-2 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium
                    bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300
                    min-h-[44px] sm:min-h-0 whitespace-nowrap flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="クリップボードから貼り付け"
                >
                  <Clipboard className="w-4 h-4" />
                  <span className="hidden sm:inline">貼付</span>
                  <span className="sm:hidden">貼付</span>
                </motion.button>
              )}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={loading}
              aria-label={label}
              aria-invalid={isValid === false}
              aria-describedby={error ? "prairie-error" : isValid === false ? "prairie-invalid" : undefined}
              className={`
                w-full px-4 py-3.5 pr-12 min-h-[48px]
                bg-gray-800/50 backdrop-blur-sm
                border rounded-xl
                text-base sm:text-sm text-gray-200 placeholder-gray-500
                focus:outline-none focus:ring-2 
                transition-all duration-300
                ${isValid === true 
                  ? 'border-green-500 focus:ring-green-500' 
                  : isValid === false 
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            
            {/* ステータスアイコン */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
              {loading && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              {!loading && isValid === true && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              )}
              {!loading && isValid === false && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-500"
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
              {!loading && isValid === null && url === "" && (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* QRスキャナー表示 */}
        {inputMethod === 'qr' && qrScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-xl overflow-hidden bg-black"
          >
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-purple-400 rounded-lg">
                <div className="w-full h-full border-2 border-purple-400 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  QRコードを枠内に合わせてください
                </p>
              </div>
              <button
                type="button"
                onClick={stopQR}
                aria-label="QRスキャナーを閉じる"
                className="p-2 bg-black/70 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
        
        {/* NFCスキャン中の表示 */}
        {nfcScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-blue-400 animate-pulse" />
                <div>
                  <p className="text-blue-400 font-semibold">NFCスキャン中...</p>
                  <p className="text-gray-400 text-sm">NFCタグまたはカードを近づけてください</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopNFC}
                aria-label="NFCスキャンを中止"
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}

        {/* リトライ中の表示 */}
        {isRetrying && retryAttempt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
            className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" aria-hidden="true" />
                <div>
                  <p className="text-yellow-400 font-semibold">接続を再試行中... ({retryAttempt}/3)</p>
                  <p className="text-gray-400 text-sm">Prairie Card APIに接続しています</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* エラーメッセージ */}
        {(error || nfcError || qrError) && !isRetrying && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            id="prairie-error"
            aria-live="polite"
            className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold">{error || nfcError || qrError}</p>
                  {error && error.includes('APIが一時的に利用できません') && (
                    <p className="text-gray-400 text-sm mt-1">
                      Prairie Card のサーバーが応答していません。サンプルデータで診断機能をお試しいただけます。
                    </p>
                  )}
                </div>
              </div>
              
              {/* サンプルデータ使用ボタン（開発環境のみ） */}
              {error && (
                <div className="flex gap-2">
                  {process.env.NODE_ENV === 'development' && (
                    <motion.button
                      type="button"
                      onClick={useSampleData}
                      className="flex-1 py-3 px-4 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                        font-medium transition-colors flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <User className="w-4 h-4" />
                      サンプルデータを使用
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    onClick={() => {
                      clearError();
                      if (nfcError) clearNFCError();
                      if (qrError) clearQRError();
                    }}
                    className="py-3 px-4 min-h-[44px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg
                      font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    閉じる
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* プロフィール表示 */}
        {profile && isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-center gap-3">
              {profile.basic.avatar && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={profile.basic.avatar} 
                    alt={profile.basic.name}
                    className="w-12 h-12 rounded-full"
                  />
                </>
              )}
              <div>
                <p className="text-gray-900 font-semibold">{profile.basic.name}</p>
                {profile.basic.title && (
                  <p className="text-gray-600 text-sm">{profile.basic.title}</p>
                )}
                {profile.basic.company && (
                  <p className="text-gray-600 text-sm">{profile.basic.company}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 送信ボタン */}
        <motion.button
          type="submit"
          disabled={loading || !url.trim()}
          className={`
            w-full py-4 px-6 min-h-[52px]
            font-semibold rounded-xl text-base
            transition-all duration-300
            ${loading || !url.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }
          `}
          whileHover={!loading && url.trim() ? { scale: 1.02 } : {}}
          whileTap={!loading && url.trim() ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Prairie Card読み込み中...
            </span>
          ) : (
            'Prairie Cardを読み込む'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}