"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrairieCard } from "@/hooks/usePrairieCard";
import { useNFC } from "@/hooks/useNFC";
import { PrairieProfile } from "@/types";
import { Loader2, Check, AlertCircle, User, Smartphone, X } from "lucide-react";

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
  const { loading, error, profile, fetchProfile, clearError } = usePrairieCard();
  const { 
    isSupported: nfcSupported, 
    isScanning, 
    lastReadUrl, 
    error: nfcError, 
    startScan, 
    stopScan,
    clearError: clearNFCError 
  } = useNFC();
  
  // Handle NFC URL when read
  useEffect(() => {
    if (lastReadUrl) {
      setUrl(lastReadUrl);
      // Automatically fetch profile when NFC URL is read
      handleFetchProfile(lastReadUrl);
    }
  }, [lastReadUrl]);

  const handleFetchProfile = async (profileUrl: string) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFetchProfile(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setIsValid(null);
    if (error) clearError();
    if (nfcError) clearNFCError();
  };

  const handleNFCScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      await startScan();
    }
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
            {nfcSupported && (
              <motion.button
                type="button"
                onClick={handleNFCScan}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                  transition-all duration-300
                  ${isScanning 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smartphone className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
                {isScanning ? 'NFCスキャン中...' : 'NFCで読み取る'}
              </motion.button>
            )}
          </div>
          
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={loading}
              className={`
                w-full px-4 py-3 pr-12 
                bg-gray-800/50 backdrop-blur-sm
                border rounded-xl
                text-gray-200 placeholder-gray-500
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
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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

        {/* NFCスキャン中の表示 */}
        {isScanning && (
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
                onClick={stopScan}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* エラーメッセージ */}
        {(error || nfcError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error || nfcError}</span>
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
                <img 
                  src={profile.basic.avatar} 
                  alt={profile.basic.name}
                  className="w-12 h-12 rounded-full"
                />
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
            w-full py-3 px-6 
            font-semibold rounded-xl
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