"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface MenuCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

export function MenuCard({ href, icon, title, description, delay = 0 }: MenuCardProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={href}>
        <div className="glass-effect rounded-3xl p-8 text-center cursor-pointer squared-shadow hover:shadow-2xl transition-all duration-300">
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/80">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}