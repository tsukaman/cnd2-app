'use client';

import { motion } from 'framer-motion';
import { Cloud, Cpu, Database, Network, Server, Shield } from 'lucide-react';

const cloudNativeIcons = [Cloud, Cpu, Database, Network, Server, Shield];

interface LoadingAnimationProps {
  message?: string;
}

export default function LoadingAnimation({ message = '処理中...' }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Icon Grid Animation */}
      <div className="relative w-32 h-32 mb-8">
        {cloudNativeIcons.map((Icon, index) => {
          const angle = (index / cloudNativeIcons.length) * 2 * Math.PI;
          const radius = 40;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                x: x,
                y: y,
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                },
              }}
            >
              <Icon className="w-8 h-8 text-blue-500" />
            </motion.div>
          );
        })}
        
        {/* Center Logo */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            C²
          </div>
        </motion.div>
      </div>
      
      {/* Loading Message */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center"
      >
        <p className="text-xl font-semibold text-gray-700 mb-2">{message}</p>
        
        {/* Loading Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Progress Bar */}
      <motion.div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-6">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: '50%' }}
        />
      </motion.div>
    </div>
  );
}