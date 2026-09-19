'use client';

import Image from 'next/image';
import { useState } from 'react';

interface RemoteImageProps {
  src?: string | null;
  alt: string;
  placeholder?: string;
  sizes?: string;
  style?: React.CSSProperties;
}

function getValidImageUrl(src: string | null | undefined) {
  if (typeof src !== 'string' || !src.trim()) return '';

  try {
    const url = new URL(src.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function RemoteImage({ src, alt, placeholder = 'NO COVER', sizes, style }: RemoteImageProps) {
  const imageUrl = getValidImageUrl(src);
  const [failedUrl, setFailedUrl] = useState('');
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  if (!showImage) {
    return <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#79747e', fontSize: 12 }}>{placeholder}</div>;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes={sizes}
      loading="lazy"
      unoptimized
      onError={() => setFailedUrl(imageUrl)}
      style={{ objectFit: 'cover', ...style }}
    />
  );
}