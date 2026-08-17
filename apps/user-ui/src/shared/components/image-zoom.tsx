'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

/**
 * Hover-zoom on the main image — a lens-free variant of the classic
 * "zoom follows the cursor" pattern, done with a CSS transform instead of
 * the unmaintained react-image-magnify.
 */
export function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState('50% 50%');
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      ref={ref}
      className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-surface-container"
      onMouseMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setOrigin(`${x}% ${y}%`);
      }}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className="object-cover transition-transform duration-150 ease-out"
        style={{
          transformOrigin: origin,
          transform: zoomed ? 'scale(2)' : 'scale(1)',
        }}
      />
    </div>
  );
}
