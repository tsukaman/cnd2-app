import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'グループ診断 - 準備中 | CND²',
  description: 'グループ診断機能は現在準備中です。より良い体験を提供するため機能を改善しています。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}