"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { X, Download, Share2 } from "lucide-react";
import { logger } from "@/lib/logger";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string;
  score: number;
}

export function QRCodeModal({ isOpen, onClose, resultId, score }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const resultUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2-app.pages.dev'}/duo/results?id=${resultId}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(resultUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1E1B4B",
          light: "#FFFFFF",
        },
      }).then(setQrCodeUrl);
    }
  }, [isOpen, resultUrl]);

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.download = `cnd2-result-${resultId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        const blob = await fetch(qrCodeUrl).then(r => r.blob());
        const file = new File([blob], `cnd2-result-${resultId}.png`, { type: "image/png" });
        await navigator.share({
          title: "CND² 診断結果",
          text: `相性スコア: ${score}/100\n診断結果はこちら: ${resultUrl}`,
          files: [file],
        });
      } catch (error) {
        logger.error("[QRCodeModal] Share failed:", error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6"
          >
            <div className="glass-effect rounded-2xl p-6 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                診断結果をシェア
              </h3>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="bg-white rounded-xl p-4 mb-6">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* URL */}
              <div className="bg-white/10 rounded-lg p-3 mb-6">
                <p className="text-sm text-white/60 mb-1">診断結果URL</p>
                <p className="text-white text-sm break-all">{resultUrl}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={downloadQRCode}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-5 h-5" />
                  QRコード保存
                </motion.button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <motion.button
                    onClick={shareQRCode}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-5 h-5" />
                    共有
                  </motion.button>
                )}
              </div>

              {/* Instructions */}
              <p className="text-center text-white/60 text-sm mt-4">
                QRコードをスキャンして結果を共有しよう！
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}