"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function BackgroundEffects() {
  const [particles, setParticles] = useState<Array<{ id: number; icon: string; color: string }>>([]);

  useEffect(() => {
    const icons = [
      { emoji: "✨", color: "#F59E0B" }, // Amber
      { emoji: "🎨", color: "#FB7185" }, // Coral
      { emoji: "📝", color: "#0EA5E9" }, // Sky blue
      { emoji: "🌸", color: "#8B5CF6" }, // Purple
      { emoji: "☁️", color: "#10B981" }, // Green
      { emoji: "🎵", color: "#F59E0B" }, // Amber
      { emoji: "💡", color: "#FB7185" }, // Coral
    ];
    const newParticles = Array.from({ length: 12 }, (_, i) => {
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      return {
        id: i,
        icon: randomIcon.emoji,
        color: randomIcon.color,
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Bright Gradient Background Overlay - Subtle */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-amber-50/10 to-rose-100/20" />

      {/* Floating Particles - More Playful */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-3xl sm:text-4xl"
          initial={{
            x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
            y: -50,
            opacity: 0.15,
          }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 50 : 800,
            x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
            rotate: [0, 180, 360],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 20 + Math.random() * 15,
            repeat: Infinity,
            delay: particle.id * 1.5,
            ease: "easeInOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            filter: `drop-shadow(0 0 4px ${particle.color})`,
          }}
        >
          {particle.icon}
        </motion.div>
      ))}

      {/* Soft Grid Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
export default BackgroundEffects;
