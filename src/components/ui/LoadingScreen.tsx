"use client";

import { motion } from "framer-motion";
import {
  BACKGROUND_GRADIENT,
  LOGO_GRADIENT,
  DOT_COLORS,
} from "@/lib/constants/loading-colors";

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: BACKGROUND_GRADIENT,
      }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <motion.h1
          className="text-8xl font-black mb-4"
          style={{
            background: LOGO_GRADIENT,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            willChange: "transform", // GPU加速を明示的に要求
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          CND²
        </motion.h1>

        <motion.div
          className="flex justify-center space-x-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {DOT_COLORS.map((dot, i) => (
            <motion.div
              key={dot.label}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: dot.color,
                willChange: "transform", // GPU加速
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
export default LoadingScreen;
