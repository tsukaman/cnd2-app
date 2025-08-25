"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function BackgroundEffects() {
  const [particles, setParticles] = useState<Array<{ id: number; icon: string }>>([]);

  useEffect(() => {
    const icons = ["²", "☸️", "🚀", "📦", "⚡", "∞", "✨"];
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 opacity-50" />
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-4xl opacity-20"
          initial={{
            x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
            y: -50,
          }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 50 : 800,
            x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
            rotate: [0, 360],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: particle.id * 2,
          }}
          style={{
            left: `${Math.random() * 100}%`,
          }}
        >
          {particle.icon}
        </motion.div>
      ))}
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}