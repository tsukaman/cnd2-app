import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CND2_CONFIG } from "@/config/cnd2.config";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: `${CND2_CONFIG.app.name} - ${CND2_CONFIG.app.subtitle}`,
  description: `${CND2_CONFIG.app.description} - CloudNative Days Winter 2025。技術者が川柳を創作し、笑いでつながるゲーム。`,
  keywords: ["CloudNative Days", "CND²", "Connect 'n' Devise", "川柳", "Senryu", "クラウドネイティブ"],
  openGraph: {
    title: CND2_CONFIG.app.name,
    description: CND2_CONFIG.app.tagline,
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: CND2_CONFIG.app.name,
    description: CND2_CONFIG.app.tagline,
    creator: "@cndw2025",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          {children}
          <Toaster position="top-center" richColors />
        </ErrorBoundary>
      </body>
    </html>
  );
}
