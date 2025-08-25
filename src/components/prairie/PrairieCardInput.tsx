"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePrairieCard } from "@/hooks/usePrairieCard";
import { PrairieProfile } from "@/types";
import { Loader2, Check, AlertCircle, User } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setIsValid(false);
      return;
    }

    const result = await fetchProfile(url);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setIsValid(null);
    if (error) clearError();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
          
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

        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
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