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
      <div className="text-center text-white">
        <p className="text-lg">リダイレクト中...</p>
      </div>
    </div>
  );
}