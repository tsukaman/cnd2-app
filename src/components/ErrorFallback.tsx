"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useEffect } from "react";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  useEffect(() => {
    // Log error to error tracking service
    console.error('Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-purple flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="glass-effect rounded-2xl p-8 text-center">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6"
          >
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-4">
            エラーが発生しました
          </h1>

          <p className="text-white/80 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            問題が解決しない場合は、しばらく時間をおいてから再度お試しください。
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-white/60 hover:text-white transition-colors">
                エラー詳細（開発環境のみ）
              </summary>
              <div className="mt-2 p-4 bg-black/30 rounded-lg">
                <p className="text-red-400 font-mono text-sm break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-white/60 text-xs overflow-x-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={resetError}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-5 h-5" />
              もう一度試す
            </motion.button>

            <motion.button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl font-semibold flex items-center justify-center gap-2 border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5" />
              ホームに戻る
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}