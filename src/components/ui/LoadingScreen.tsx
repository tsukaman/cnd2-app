"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 25%, #FEF3C7 50%, #FED7AA 75%, #FECACA 100%)"
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
            background: "linear-gradient(135deg, #0EA5E9 0%, #10B981 50%, #F59E0B 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
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
          {[
            { color: "#0EA5E9" }, // Sky blue
            { color: "#10B981" }, // Emerald
            { color: "#F59E0B" }, // Amber
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dot.color }}
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
