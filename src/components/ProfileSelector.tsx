'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Upload, User } from 'lucide-react';

interface ProfileSelectorProps {
  onScan: (url: string) => void;
  index: number;
  profile?: any;
  loading?: boolean;
  error?: string;
}

export function ProfileSelector({
  onScan,
  index,
  profile,
  loading = false,
  error
}: ProfileSelectorProps) {
  const [inputUrl, setInputUrl] = useState('');

  const handleScan = () => {
    if (inputUrl.trim()) {
      onScan(inputUrl.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        onScan(text);
      }
    } catch (err) {
      // クリップボード読み取りに失敗した場合は何もしない
    }
  };

  return (
    <motion.div
      className="border rounded-lg p-6 bg-white shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-800">
          参加者 {index + 1}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {profile ? (
        <motion.div
          className="bg-gray-50 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{profile.basic?.name}</h4>
              <p className="text-sm text-gray-600">{profile.basic?.title}</p>
              <p className="text-xs text-gray-500">{profile.basic?.company}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setInputUrl('');
              // Reset profile by calling with empty string
            }}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            変更
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prairie Card URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://prairie.cards/..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handlePaste}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
                title="クリップボードから貼り付け"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={loading || !inputUrl.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  読み込み中...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  スキャン
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}