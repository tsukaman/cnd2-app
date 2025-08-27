'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toBase64 } from '@/lib/utils/edge-compat';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  fallback?: string;
  onError?: (event?: any) => void;
  onLoad?: (event?: any) => void;
  decorative?: boolean;
  disableAnimation?: boolean;
  srcSet?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  fill = false,
  sizes,
  quality = 85,
  fallback,
  onError,
  onLoad,
  decorative = false,
  disableAnimation = false,
  srcSet,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [inView, setInView] = useState(priority);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Memoize blur placeholder to avoid re-creating on every render
  const blurDataURL = useMemo(() => {
    const svg = `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`;
    return `data:image/svg+xml;base64,${toBase64(svg)}`;
  }, [width, height]);

  if (error && !fallback) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">画像を読み込めませんでした</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {!inView && (
        <div className="bg-gray-200 animate-pulse" style={{ width, height }} />
      )}
      {isLoading && inView && (
        <motion.div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {inView && <Image
        src={error && fallback ? fallback : currentSrc}
        alt={decorative ? '' : alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        sizes={sizes || (fill ? '100vw' : undefined)}
        priority={priority}
        quality={quality}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={blurDataURL}
        srcSet={srcSet}
        aria-hidden={decorative}
        onLoadingComplete={(event) => {
          setIsLoading(false);
          onLoad?.(event);
        }}
        onLoad={(event) => {
          setIsLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setIsLoading(false);
          if (fallback && !error) {
            setCurrentSrc(fallback);
            setError(true);
          } else {
            setError(true);
          }
          onError?.(event);
        }}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} ${
          disableAnimation ? '' : 'transition-opacity duration-300'
        } ${className}`}
      />}
    </div>
  );
}