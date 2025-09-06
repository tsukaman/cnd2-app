"use client";

import { motion } from "framer-motion";
import { CND2_CONFIG } from "@/config/cnd2.config";

interface ConsentDialogProps {
  onConsent: () => void;
}

export function ConsentDialog({ onConsent }: ConsentDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full glass-effect rounded-3xl p-8"
      >
        <motion.h2
          className="text-3xl font-bold mb-4 gradient-text"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          CND² へようこそ！
        </motion.h2>

        <p className="text-xl text-white/90 mb-2 font-bold">
          {CND2_CONFIG.app.tagline}
        </p>

        <p className="text-white/80 mb-6">
          本アプリは診断のためPrairie Cardの公開情報を利用します。
          診断結果は7日後に自動削除されます。
        </p>

        <motion.button
          onClick={onConsent}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold rounded-2xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🚀 出会いを二乗でスケール！
        </motion.button>

        <p className="text-xs text-white/60 mt-4 text-center">
          Works with {CND2_CONFIG.app.poweredBy}
        </p>
      </motion.div>
    </motion.div>
  );
}
export default ConsentDialog;
