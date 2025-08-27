'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
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
  disableAnimation?: boolean;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
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
  disableAnimation = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Memoize blur placeholder to avoid re-creating on every render
  const blurDataURL = useMemo(() => {
    const svg = `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`;
    return `data:image/svg+xml;base64,${toBase64(svg)}`;
  }, [width, height]);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">画像を読み込めませんでした</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <Image
        src={currentSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        sizes={sizes || (fill ? '100vw' : undefined)}
        priority={priority}
        quality={quality}
        loading={priority ? undefined : 'lazy'}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onLoadingComplete={() => setIsLoading(false)}
        onLoad={(event: any) => {
          setIsLoading(false);
          onLoad?.(event);
        }}
        onError={(event: any) => {
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
      />
    </div>
  );
}