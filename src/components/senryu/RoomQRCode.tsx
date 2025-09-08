"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { QrCode, Download, Share2, X } from "lucide-react";

interface RoomQRCodeProps {
  roomCode: string;
  isHost?: boolean;
}

export function RoomQRCode({ roomCode, isHost = false }: RoomQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  
  // QRコードからアクセスする場合、部屋コードが自動入力されるURL
  const roomUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/senryu?room=${roomCode}`
    : `http://localhost:8788/senryu?room=${roomCode}`;

  useEffect(() => {
    // QRコード生成
    QRCode.toDataURL(roomUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#EA580C", // オレンジ色
        light: "#FFFFFF",
      },
    }).then(setQrCodeUrl).catch(console.error);
  }, [roomUrl]);

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.download = `senryu-room-${roomCode}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const shareRoom = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: "CloudNative川柳ゲーム",
          text: `部屋コード: ${roomCode}\n一緒に川柳ゲームで遊びましょう！`,
          url: roomUrl,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    }
  };

  if (!isHost) {
    return null;
  }

  return (
    <>
      {/* QRコードボタン */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
      >
        <QrCode className="w-5 h-5" />
        QRコード表示
      </button>

      {/* QRコードモーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 !z-[99999] flex items-start justify-center bg-black/50 p-4 overflow-y-auto isolate"
            onClick={() => setShowModal(false)}
            style={{ zIndex: 99999 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative !z-[100000] bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl mt-8 mb-8"
              onClick={(e) => e.stopPropagation()}
              style={{ zIndex: 100000 }}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  部屋のQRコード
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 部屋コード表示 */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">部屋コード</p>
                <p className="text-3xl font-bold text-orange-600 tracking-wider">
                  {roomCode}
                </p>
              </div>

              {/* QRコード */}
              {qrCodeUrl && (
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-2xl shadow-inner">
                    <img src={qrCodeUrl} alt="Room QR Code" className="w-64 h-64" />
                  </div>
                </div>
              )}

              {/* 説明文 */}
              <p className="text-sm text-gray-600 text-center mb-6">
                スマートフォンでQRコードを読み取ると、
                部屋コードが自動入力された状態で参加画面が開きます
              </p>

              {/* アクションボタン */}
              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  ダウンロード
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={shareRoom}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    共有
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}