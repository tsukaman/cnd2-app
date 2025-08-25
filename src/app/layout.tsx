import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CND2_CONFIG } from "@/config/cnd2.config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${CND2_CONFIG.app.name} - ${CND2_CONFIG.app.tagline}`,
  description: "CloudNative Days Winter 2025 相性診断アプリ。Prairie Cardで出会いを二乗でスケール！",
  keywords: ["CloudNative Days", "CND²", "CNDxCnD", "Prairie Card", "相性診断"],
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
