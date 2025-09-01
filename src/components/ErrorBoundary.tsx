'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { ErrorHandler, CND2Error } from '@/lib/errors';

// Sentry type declaration
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: {
        contexts?: {
          react?: {
            componentStack?: string;
          };
        };
      }) => void;
    };
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    // This is called during the render phase, so no side effects
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // テスト環境では副作用をスキップ
    if (process.env.NODE_ENV === 'test') {
      console.log('Error caught in test:', error.message);
      return;
    }
    
    // エラーログを記録
    try {
      const cnd2Error = error instanceof CND2Error ? error : ErrorHandler.mapError(error);
      ErrorHandler.logError(cnd2Error, 'ErrorBoundary');
    } catch (logError) {
      // ログエラーを無視して続行
      console.error('Failed to log error:', logError);
    }

    // 本番環境では外部サービスにエラーを送信
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry if configured
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
      console.error('Error caught by boundary:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // デフォルトのエラー画面
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
          >
            {/* エラーアイコン */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </motion.div>

            {/* エラータイトル */}
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-900">
              エラーが発生しました
            </h1>

            {/* エラーメッセージ */}
            <p className="text-gray-600 text-center mb-8">
              申し訳ございません。予期しないエラーが発生しました。
              {this.state.error instanceof CND2Error && (
                <span className="block mt-2 text-sm">
                  {ErrorHandler.getUserMessage(this.state.error)}
                </span>
              )}
            </p>

            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700">
                  エラー詳細（開発環境のみ）
                </summary>
                <pre className="mt-4 text-xs text-gray-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <>
                      {'\n\nStack trace:\n'}
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      {'\n\nComponent stack:\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                再試行
              </motion.button>

              <Link href="/" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                >
                  <Home className="w-5 h-5" />
                  ホームへ
                </motion.button>
              </Link>
            </div>

            {/* エラーID（サポート用） */}
            {this.state.error instanceof CND2Error && this.state.error.code && (
              <p className="text-xs text-gray-400 text-center mt-6">
                エラーコード: {this.state.error.code}
              </p>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 非同期エラーバウンダリー用のラッパーコンポーネント
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default ErrorBoundary;