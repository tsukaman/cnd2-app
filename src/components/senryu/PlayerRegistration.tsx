'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PlayerRegistrationProps {
  onComplete: (settings: {
    name: string;
    allowRanking: boolean;
    anonymousRanking: boolean;
  }) => void;
}

export function PlayerRegistration({ onComplete }: PlayerRegistrationProps) {
  const [playerName, setPlayerName] = useState('');
  const [rankingPreference, setRankingPreference] = useState<'public' | 'anonymous' | 'none'>('public');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 禁止ワードリスト
  const PROHIBITED_WORDS = [
    'admin', '管理者', 'root', 'system', 
    'fuck', 'shit', 'damn', 'hell',
    '死ね', '殺す', 'バカ', 'アホ'
  ];

  const validateName = (name: string): boolean => {
    // 空チェック
    if (!name.trim()) {
      toast.error('名前を入力してください');
      return false;
    }

    // 長さチェック
    if (name.length < 1 || name.length > 20) {
      toast.error('名前は1〜20文字で入力してください');
      return false;
    }

    // 禁止ワードチェック
    const lowerName = name.toLowerCase();
    for (const word of PROHIBITED_WORDS) {
      if (lowerName.includes(word.toLowerCase())) {
        toast.error('その名前は使用できません');
        return false;
      }
    }

    // 危険な文字のみチェック（HTMLタグやスクリプトインジェクション対策）
    // より多くの文字（絵文字、記号等）を許可
    if (/<[^>]*>/.test(name) || /[<>\"'`]/.test(name)) {
      toast.error('HTMLタグや特殊記号（<>\"\'`）は使用できません');
      return false;
    }
    
    // 制御文字のチェック
    if (/[\x00-\x1F\x7F]/.test(name)) {
      toast.error('制御文字は使用できません');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!agreedToTerms) {
      toast.error('利用規約に同意してください');
      return;
    }
    
    if (!validateName(playerName)) {
      return;
    }
    
    // ランキング設定を反映
    const settings = {
      name: playerName,
      allowRanking: rankingPreference !== 'none',
      anonymousRanking: rankingPreference === 'anonymous'
    };
    
    toast.success('ユーザー名を設定しました！');
    onComplete(settings);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span className="text-3xl">👤</span>
        ユーザー名設定
      </h2>
      
      <div className="space-y-6">
        {/* 名前入力 */}
        <div>
          <label className="block text-sm mb-2 text-gray-700 font-medium">
            ユーザー名
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="例: クラウド太郎"
            maxLength={20}
            className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-400 transition-colors text-gray-800"
          />
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>※ 1〜20文字で入力してください</p>
            <p>※ 絵文字や記号も使用できます（HTMLタグを除く）</p>
            <p>※ 不適切な名前は管理者により削除される場合があります</p>
          </div>
        </div>

        {/* ランキング掲載設定 */}
        <div className="border-t-2 border-gray-100 pt-6">
          <p className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            ランキング掲載設定
          </p>
          
          <div className="space-y-2">
            {/* ユーザー名で掲載 */}
            <label className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors border-2 border-transparent has-[:checked]:border-blue-400">
              <input
                type="radio"
                name="ranking"
                value="public"
                checked={rankingPreference === 'public'}
                onChange={() => setRankingPreference('public')}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">ユーザー名で掲載</span>
                <p className="text-sm text-gray-600">
                  入力した名前でランキングに掲載されます
                </p>
              </div>
            </label>
            
            {/* 匿名で掲載 */}
            <label className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors border-2 border-transparent has-[:checked]:border-purple-400">
              <input
                type="radio"
                name="ranking"
                value="anonymous"
                checked={rankingPreference === 'anonymous'}
                onChange={() => setRankingPreference('anonymous')}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">匿名で掲載（詠み人知らず）</span>
                <p className="text-sm text-gray-600">
                  「詠み人知らず」として掲載されます
                </p>
              </div>
            </label>
            
            {/* 掲載しない */}
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent has-[:checked]:border-gray-400">
              <input
                type="radio"
                name="ranking"
                value="none"
                checked={rankingPreference === 'none'}
                onChange={() => setRankingPreference('none')}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">掲載しない</span>
                <p className="text-sm text-gray-600">
                  ランキングには掲載されません
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* ユーザー情報の使用目的についての説明 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span>ℹ️</span>
            ユーザー情報について
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• ユーザー情報は一時的にブラウザに保存されます</p>
            <p>• ゲーム中の表示とランキング掲載にのみ使用されます</p>
            <p>• 部屋を退出後も次回プレイ時に再利用されます</p>
            <p>• サーバーに保存されるのはゲーム中のデータのみです</p>
          </div>
        </div>

        {/* 利用規約 */}
        <div className="border-t-2 border-gray-100 pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-800">利用規約に同意</span>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>・公序良俗に反する内容の投稿は禁止です</p>
                <p>・他のプレイヤーへの誹謗中傷は禁止です</p>
                <p>・不適切な内容は削除される場合があります</p>
                <p>・楽しく遊びましょう！</p>
              </div>
            </div>
          </label>
        </div>

        {/* 登録ボタン */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!playerName || !agreedToTerms}
          className="w-full p-4 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          {!playerName ? '名前を入力してください' :
           !agreedToTerms ? '利用規約に同意してください' :
           'ゲームに参加'}
        </motion.button>
      </div>
    </motion.div>
  );
}