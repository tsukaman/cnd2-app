"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useXProfile } from "@/hooks/useXProfile";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { XProfile } from "@/types";
import { Loader2, Check, AlertCircle, AtSign, User, Clipboard, Twitter } from "lucide-react";

interface XProfileInputProps {
  onProfileLoaded: (profile: XProfile) => void;
  placeholder?: string;
  label?: string;
}

export default function XProfileInput({
  onProfileLoaded,
  placeholder = "@username または username",
  label = "X (Twitter) ユーザー名"
}: XProfileInputProps) {
  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const {
    loading,
    error,
    profile,
    retryAttempt,
    isRetrying,
    fetchProfile,
    clearError,
    useSampleData
  } = useXProfile();

  // Clipboard Hook - ユーザー名のペースト用
  const {
    isSupported: clipboardSupported,
    lastPastedUrl: pastedText,
    checkClipboard,
    clearPastedUrl
  } = useClipboardPaste();

  // Handle profile fetch
  const handleFetchProfile = useCallback(async (inputUsername: string) => {
    // Clean username (remove @ symbol)
    const cleanUsername = inputUsername.trim().replace(/^@/, '');

    if (!cleanUsername) {
      setIsValid(false);
      return;
    }

    // Validate username format (1-15 chars, alphanumeric and underscore only)
    if (!/^[A-Za-z0-9_]{1,15}$/.test(cleanUsername)) {
      setIsValid(false);
      return;
    }

    const result = await fetchProfile(cleanUsername);
    if (result) {
      setIsValid(true);
      onProfileLoaded(result);
      // 成功したらクリア
      setTimeout(() => {
        setUsername("");
        setIsValid(null);
      }, 2000);
    } else {
      setIsValid(false);
    }
  }, [fetchProfile, onProfileLoaded]);

  // Handle pasted username
  useEffect(() => {
    if (pastedText && !username) {
      // Extract username from various formats
      let extractedUsername = pastedText;

      // Handle full URLs like https://x.com/username or https://twitter.com/username
      const urlMatch = pastedText.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/);
      if (urlMatch) {
        extractedUsername = urlMatch[1];
      }

      // Clean and set username
      extractedUsername = extractedUsername.replace(/^@/, '');

      if (/^[A-Za-z0-9_]{1,15}$/.test(extractedUsername)) {
        setUsername(extractedUsername);
        // Auto-fetch if valid username
        handleFetchProfile(extractedUsername);
      }

      clearPastedUrl();
    }
  }, [pastedText, handleFetchProfile, clearPastedUrl, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFetchProfile(username);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow @ symbol but don't require it
    setUsername(value);
    setIsValid(null);
    if (error) clearError();
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
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              {label}
            </label>
            <div className="flex items-center gap-2">
              {/* Clipboard Button */}
              {clipboardSupported && (
                <motion.button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="クリップボードから貼り付け"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>貼付</span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="relative">
            {/* @ Symbol Icon */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <AtSign className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={loading}
              aria-label={label}
              aria-invalid={isValid === false}
              aria-describedby={error ? "x-error" : isValid === false ? "x-invalid" : undefined}
              className={`
                w-full pl-10 pr-12 py-3.5
                bg-gray-800/50 backdrop-blur-sm
                border rounded-xl
                text-sm text-gray-200 placeholder-gray-500
                focus:outline-none focus:ring-2
                transition-all duration-300
                ${isValid === true
                  ? 'border-green-500 focus:ring-green-500'
                  : isValid === false
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-600 focus:ring-blue-500'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />

            {/* Status Icon */}
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
              {!loading && isValid === null && username === "" && (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Helper Text */}
          {!error && !isRetrying && (
            <p className="text-xs text-gray-400 mt-1">
              @なしでも入力できます（例: elonmusk）
            </p>
          )}
        </div>

        {/* Retry Status */}
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
                  <p className="text-gray-400 text-sm">X プロフィールを取得しています</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && !isRetrying && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            id="x-error"
            aria-live="polite"
            className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold">{error}</p>
                  {error.includes('not found') && (
                    <p className="text-gray-400 text-sm mt-1">
                      ユーザー名を確認してください。@なしで入力してください。
                    </p>
                  )}
                  {error.includes('protected') && (
                    <p className="text-gray-400 text-sm mt-1">
                      非公開アカウントの情報は取得できません。
                    </p>
                  )}
                </div>
              </div>

              {/* Sample Data Button (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    onClick={useSampleData}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                      font-medium transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-4 h-4" />
                    サンプルデータを使用
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={clearError}
                    className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg
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

        {/* Profile Preview */}
        {profile && isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 backdrop-blur-sm"
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">{profile.basic.name}</p>
                  {profile.basic.verified && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">@{profile.basic.username}</p>
                {profile.basic.bio && (
                  <p className="text-gray-300 text-sm mt-1 line-clamp-2">{profile.basic.bio}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span>{profile.metrics.followers.toLocaleString()} フォロワー</span>
                  <span>{profile.metrics.tweets.toLocaleString()} ポスト</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading || !username.trim()}
          className={`
            w-full py-4 px-6
            font-semibold rounded-xl text-base
            transition-all duration-300
            ${loading || !username.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }
          `}
          whileHover={!loading && username.trim() ? { scale: 1.02 } : {}}
          whileTap={!loading && username.trim() ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              プロフィール読み込み中...
            </span>
          ) : (
            'X プロフィールを読み込む'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}