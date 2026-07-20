'use client';

import type { ReactNode } from 'react';
import { useAuthImage } from '@/hooks/use-auth-image';
import { cn } from '@/lib/utils';

/** Authenticated <img> for API-protected JPEGs (Bearer via axios → blob URL). */
export function AuthImage({
  url,
  alt,
  className,
  fallback,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const { src } = useAuthImage(url);
  if (!url) return <>{fallback ?? null}</>;
  if (!src) {
    return (
      fallback ?? (
        <div className={cn('flex items-center justify-center bg-zinc-950', className)}>
          <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-700" />
        </div>
      )
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
