"use client";

import { motion } from "framer-motion";
import { CND2_CONFIG } from "@/config/cnd2.config";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

export function Logo({ size = "lg", animate = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl md:text-8xl",
    xl: "text-8xl md:text-9xl",
  };

  return (
    <motion.div className="text-center">
      <motion.h1
        className={`${sizeClasses[size]} font-black mb-4`}
        style={{
          background: "linear-gradient(45deg, #00D4FF, #9B59B6, #00FF88)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
        animate={
          animate
            ? {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
            : undefined
        }
        transition={{ duration: 10, repeat: Infinity }}
      >
        CND²
      </motion.h1>
      
      <motion.p 
        className="text-xl md:text-2xl text-white mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {CND2_CONFIG.app.tagline}
      </motion.p>
      
      <motion.p 
        className="text-lg md:text-xl text-cyan-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {CND2_CONFIG.app.hashtag}
      </motion.p>
      
      <motion.p 
        className="text-sm text-white/60 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Powered by {CND2_CONFIG.app.poweredBy}
      </motion.p>
    </motion.div>
  );
}