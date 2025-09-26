'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * SSE版のルームページは廃止されました。
 * WebSocket版へ自動的にリダイレクトします。
 */
export default function SenryuGameRoomLegacy() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('id');
  
  useEffect(() => {
    // WebSocket版へリダイレクト
    if (roomId) {
      router.replace(`/senryu/room-ws?id=${roomId}`);
    } else {
      router.replace('/senryu');
    }
  }, [roomId, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-2">リダイレクト中...</p>
        <p className="text-sm text-gray-500">WebSocket版へ移動します</p>
      </div>
    </div>
  );
}