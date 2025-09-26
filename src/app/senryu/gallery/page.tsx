'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Users, TrendingUp, Shuffle, Clock, Heart } from 'lucide-react';
import { senryuApi } from '@/lib/senryu/api-client';
import { useSenryuSession } from '@/hooks/useSenryuSession';
import { LikeButton } from '@/components/senryu/LikeButton';
import type { GalleryEntry } from '@/lib/senryu/types';
import { toast } from 'sonner';

export default function SenryuGallery() {
  const router = useRouter();
  const sessionId = useSenryuSession();
  
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'latest' | 'popular' | 'random'>('latest');
  const [playerCountFilter, setPlayerCountFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // ギャラリーデータ取得（AbortController追加）
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const params: any = { sort };
        
        // プレイヤー数フィルター
        if (playerCountFilter !== 'all') {
          const [min, max] = playerCountFilter.split('-').map(Number);
          params.playerCountMin = min;
          params.playerCountMax = max;
        }
        
        // AbortSignalを追加（将来的にAPIクライアントで対応）
        const { entries: data } = await senryuApi.getGalleryList(params);
        
        // コンポーネントがアンマウントされていない場合のみ状態を更新
        if (!controller.signal.aborted) {
          setEntries(data);
        }
      } catch (error: any) {
        // 中断エラーは無視
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch gallery:', error);
          toast.error('ギャラリーの読み込みに失敗しました');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchGallery();
    
    // クリーンアップ関数
    return () => {
      controller.abort();
    };
  }, [sort, playerCountFilter]);
  
  // いいね処理
  const handleLike = async (entryId: string, sessionId: string) => {
    try {
      const result = await senryuApi.likeGalleryEntry(entryId, sessionId);
      
      // エントリー更新
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, likes: result.likes, likedBy: [...entry.likedBy, sessionId] }
          : entry
      ));
      
      return result;
    } catch (error: any) {
      if (error.message?.includes('レート制限')) {
        toast.error('いいねの制限に達しました。しばらくお待ちください。');
      }
      throw error;
    }
  };
  
  const handleUnlike = async (entryId: string, sessionId: string) => {
    try {
      const result = await senryuApi.unlikeGalleryEntry(entryId, sessionId);
      
      // エントリー更新
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, likes: result.likes, likedBy: entry.likedBy.filter(id => id !== sessionId) }
          : entry
      ));
      
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-2 border-orange-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent"
            >
              🎨 川柳ギャラリー
            </motion.h1>
            
            <button
              onClick={() => router.push('/senryu')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← ロビーへ戻る
            </button>
          </div>
          
          <p className="mt-2 text-gray-600">
            みんなの作品を楽しもう！気に入った作品にはいいねを送ろう
          </p>
        </div>
      </header>
      
      {/* フィルター */}
      <div className="sticky top-[88px] z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* ソート */}
            <div className="flex gap-2">
              <button
                onClick={() => setSort('latest')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sort === 'latest'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                新着順
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sort === 'popular'
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                人気順
              </button>
              <button
                onClick={() => setSort('random')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sort === 'random'
                    ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                ランダム
              </button>
            </div>
            
            {/* プレイヤー数フィルター */}
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerCountFilter('all')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  playerCountFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                全て
              </button>
              <button
                onClick={() => setPlayerCountFilter('2-3')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  playerCountFilter === '2-3'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                2-3人
              </button>
              <button
                onClick={() => setPlayerCountFilter('4-6')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  playerCountFilter === '4-6'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                4-6人
              </button>
              <button
                onClick={() => setPlayerCountFilter('7-10')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  playerCountFilter === '7-10'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                7-10人
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* ギャラリーグリッド */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <p className="text-gray-500">作品を読み込み中...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-500 text-lg">まだ作品がありません</p>
              <p className="text-gray-400 mt-2">最初の投稿者になりましょう！</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* カードヘッダー */}
                    <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{entry.playerCount}人戦</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 川柳本体 */}
                    <div 
                      className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className="text-lg font-serif text-gray-800 leading-relaxed">
                        <div>{entry.senryu.upper.text}</div>
                        <div className="ml-4">{entry.senryu.middle.text}</div>
                        <div className="ml-8">{entry.senryu.lower.text}</div>
                      </div>
                      
                      {/* 作者名 */}
                      <div className="mt-4 text-sm text-gray-600">
                        <span className={entry.isAnonymous ? 'italic' : ''}>
                          {entry.isAnonymous ? '👤 詠み人知らず' : `✍️ ${entry.authorName}`}
                        </span>
                      </div>
                    </div>
                    
                    {/* 展開時の詳細 */}
                    <AnimatePresence>
                      {expandedId === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-3 overflow-hidden"
                        >
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>🎮 {entry.roomCode}</span>
                              <span>📅 {new Date(entry.gameDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* アクションバー */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <LikeButton
                          entryId={entry.id}
                          initialLikes={entry.likes}
                          initialLiked={sessionId ? entry.likedBy.includes(sessionId) : false}
                          sessionId={sessionId}
                          onLike={handleLike}
                          onUnlike={handleUnlike}
                        />
                        
                        {/* SNS共有ボタン（将来実装） */}
                        <div className="flex items-center gap-2">
                          {/* 
                          <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <Share2 className="w-4 h-4 text-gray-600" />
                          </button>
                          */}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}