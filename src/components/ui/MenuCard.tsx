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
        <div className="card-dark p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:glow-purple">
          <div className="text-6xl mb-4 filter drop-shadow-lg animate-float">{icon}</div>
          <h3 className="text-2xl font-bold gradient-text mb-2">{title}</h3>
          <p className="text-gray-400 font-medium">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
export default MenuCard;
