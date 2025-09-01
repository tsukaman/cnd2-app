import { Metadata } from 'next';
import { DiagnosisResult } from '@/types';
import SharedResultClient from './SharedResultClient';

/**
 * OGP用のメタデータを生成
 * SNS共有時のプレビュー最適化
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    // 結果を取得
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2.cloudnativedays.jp';
    const response = await fetch(
      `${baseUrl}/api/results/${id}`,
      { 
        next: { revalidate: 3600 } // 1時間キャッシュ
      }
    );

    if (!response.ok) {
      return getDefaultMetadata();
    }

    const data = await response.json();
    const result: DiagnosisResult = data.data?.result;

    if (!result) {
      return getDefaultMetadata();
    }

    const title = `${result.type} - 相性${result.compatibility}% | CND² 相性診断`;
    const description = result.summary || 'CloudNative Days × Cloud Native Developersの相性診断結果';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/result/${id}`,
        siteName: 'CND² 相性診断',
        images: [
          {
            url: `/api/og?score=${result.compatibility}&type=${encodeURIComponent(result.type)}`,
            width: 1200,
            height: 630,
            alt: `相性${result.compatibility}% - ${result.type}`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og?score=${result.compatibility}&type=${encodeURIComponent(result.type)}`],
        creator: '@cloudnativedays'
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        }
      }
    };
  } catch (error) {
    console.error('[Metadata] Failed to generate metadata:', error);
    return getDefaultMetadata();
  }
}

/**
 * デフォルトのメタデータ
 */
function getDefaultMetadata(): Metadata {
  return {
    title: 'CND² 相性診断',
    description: 'CloudNative Days × Cloud Native Developersの相性診断',
    openGraph: {
      title: 'CND² 相性診断',
      description: 'CloudNative Days × Cloud Native Developersの相性診断',
      type: 'website',
      url: 'https://cnd2.cloudnativedays.jp',
      siteName: 'CND² 相性診断',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'CND² 相性診断'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CND² 相性診断',
      description: 'CloudNative Days × Cloud Native Developersの相性診断',
      images: ['/og-image.png'],
      creator: '@cloudnativedays'
    }
  };
}

/**
 * 共有用診断結果表示ページ（サーバーコンポーネント）
 * /result/[id] でアクセスされる
 */
export default async function SharedResultPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // クライアントコンポーネントに結果IDを渡す
  const { id } = await params;
  return <SharedResultClient resultId={id} />;
}