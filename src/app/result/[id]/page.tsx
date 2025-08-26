'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DiagnosisResultComponent } from '@/components/diagnosis/DiagnosisResult';
import ShareButton from '@/components/share/ShareButton';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultId = params.id as string;
        
        // APIから結果を取得
        const response = await fetch(`/api/results/${resultId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('診断結果が見つかりません');
          } else {
            setError('結果の取得中にエラーが発生しました');
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.result) {
          setResult(data.result);
        } else {
          setError('診断結果の形式が正しくありません');
        }
      } catch (err) {
        console.error('Failed to fetch result:', err);
        setError('通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* ロゴとタイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">CND²</h1>
            <p className="text-gray-600">診断結果</p>
          </div>

          {/* 診断結果コンポーネント */}
          <DiagnosisResultComponent result={result} />

          {/* 共有ボタン */}
          <div className="mt-8 flex justify-center gap-4">
            <ShareButton 
              resultId={params.id as string}
              score={result.compatibility || 80}
            />
          </div>

          {/* アクションボタン */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              トップに戻る
            </button>
            <button
              onClick={() => router.push('/duo')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              もう一度診断する
            </button>
          </div>

          {/* フッター情報 */}
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>この結果は7日後に自動的に削除されます</p>
            <p className="mt-2">#CNDxCnD</p>
          </div>
        </div>
      </div>
    </div>
  );
}