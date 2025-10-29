'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface SenryuHeaderProps {
  /**
   * Whether to show the back button
   */
  showBackButton?: boolean;
  /**
   * Where the back button should navigate to
   */
  backTo?: string;
  /**
   * Label for the back button
   */
  backLabel?: string;
  /**
   * Whether the back button should show a confirmation dialog
   * (e.g., when a game is in progress)
   */
  confirmBack?: boolean;
  /**
   * Confirmation message to show when confirmBack is true
   */
  confirmMessage?: string;
  /**
   * Title to display in the header
   */
  title?: string;
  /**
   * Whether to show a home button instead of back
   */
  showHomeButton?: boolean;
}

export function SenryuHeader({
  showBackButton = true,
  backTo = '/senryu',
  backLabel = 'ロビーへ戻る',
  confirmBack = false,
  confirmMessage = 'ゲーム中です。本当に退出しますか？',
  title,
  showHomeButton = false,
}: SenryuHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (confirmBack) {
      // Show confirmation dialog for game in progress
      if (window.confirm(confirmMessage)) {
        router.push(backTo);
      }
    } else {
      router.push(backTo);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-purple-300 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* CND² Logo - Always link to top */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            <Home className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
            <div className="text-xl font-black">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                CND²
              </span>
            </div>
          </Link>

          {/* Current page title */}
          {title && (
            <div className="hidden sm:block text-base font-semibold text-gray-700">
              {title}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {showHomeButton && (
              <Link
                href="/"
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ホーム
              </Link>
            )}

            {showBackButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
                <span className="sm:hidden">戻る</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
