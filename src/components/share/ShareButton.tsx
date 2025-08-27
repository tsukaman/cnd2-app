'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, QrCode, Copy, Check, X, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface ShareButtonProps {
  resultId: string;
  score: number;
}

export default function ShareButton({ resultId, score }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2.cloudnativedays.jp'}/result/${resultId}`;
  const shareText = `CND²相性診断結果: ${score}% #CNDxCnD`;
  
  const handleShare = async () => {
    setShowModal(true);
    
    // Generate QR code
    if (!qrCodeUrl) {
      const qr = await QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qr);
    }
  };
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('リンクをコピーしました');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleNativeShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'CND²相性診断',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    }
  };
  
  const handleNfcWrite = async () => {
    if (window.NDEFReader) {
      setNfcWriting(true);
      try {
        const ndef = new window.NDEFReader!();
        // Write URL directly as a string
        await ndef.write(shareUrl);
        toast.success('NFCタグに書き込みました');
      } catch (error) {
        console.error('NFC write failed:', error);
        toast.error('NFCの書き込みに失敗しました');
      } finally {
        setNfcWriting(false);
      }
    } else {
      toast.error('このデバイスはNFCに対応していません');
    }
  };
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
        aria-label="結果をシェア"
      >
        <Share2 className="w-5 h-5" />
        結果をシェア
      </motion.button>
      
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">結果をシェア</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* QR Code */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  QRコードを読み取って結果を確認
                </p>
              </div>
              
              {/* Share Options */}
              <div className="space-y-3">
                {/* Copy Link */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">コピーしました</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      リンクをコピー
                    </>
                  )}
                </motion.button>
                
                {/* Native Share (if available) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNativeShare}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    他のアプリでシェア
                  </motion.button>
                )}
                
                {/* NFC Write (if available) */}
                {'NDEFReader' in window && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNfcWrite}
                    disabled={nfcWriting}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Smartphone className="w-5 h-5" />
                    {nfcWriting ? 'NFCタグに書き込み中...' : 'NFCタグに書き込む'}
                  </motion.button>
                )}
              </div>
              
              {/* Social Media Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">SNSでシェア</p>
                <div className="flex gap-3">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    𝕏
                  </motion.a>
                  
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={`https://line.me/R/msg/text/?${encodeURIComponent(shareText + '\n' + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    L
                  </motion.a>
                  
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    f
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}