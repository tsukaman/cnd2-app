'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * グループ診断ページ（一時的に無効化）
 * 
 * 開発優先度の調整により、グループ診断機能は一時的に無効化されています。
 * 2人診断機能の拡充を優先するため、アクセスした場合はホームページにリダイレクトします。
 */
export default function GroupPage() {
  const router = useRouter();

  useEffect(() => {
    // ホームページにリダイレクト
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <div className="text-center text-white px-4">
        <div className="mb-4">
          <span className="text-6xl mb-4 block" role="img" aria-label="工事中">🚧</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">グループ診断は準備中です</h1>
        <p className="text-lg mb-2 text-gray-300">
          より良い体験を提供するため、機能を改善しています
        </p>
        <p className="text-sm text-gray-400">
          ホームページにリダイレクト中...
        </p>
      </div>
    </div>
  );
}