'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface LazyLoadWrapperProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
}

export default function LazyLoadWrapper({
  children,
  className = '',
  fallback = null,
  rootMargin = '100px',
  threshold = 0,
  animation = 'fade',
}: LazyLoadWrapperProps) {
  const { elementRef, isVisible } = useLazyLoad({
    rootMargin,
    threshold,
    freezeOnceVisible: true,
  });

  const animationVariants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
    none: {
      hidden: {},
      visible: {},
    },
  };

  const variants = animationVariants[animation];

  return (
    <div ref={elementRef} className={className}>
      <AnimatePresence mode="wait">
        {!isVisible && fallback ? (
          <motion.div
            key="fallback"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {fallback}
          </motion.div>
        ) : null}
        
        {isVisible && (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}