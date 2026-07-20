'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { AuthImage } from '@/components/auth-image';
import { useAuthImage } from '@/hooks/use-auth-image';
import { cn } from '@/lib/utils';

export type FallBBoxNorm = [number, number, number, number];

/** Read normalized [x1,y1,x2,y2] from fall metadata when present. */
export function bboxFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): FallBBoxNorm | null {
  const raw = metadata?.bbox_xyxy_norm;
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const nums = raw.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [x1, y1, x2, y2] = nums;
  if (x2 <= x1 || y2 <= y1) return null;
  return [
    Math.min(1, Math.max(0, x1)),
    Math.min(1, Math.max(0, y1)),
    Math.min(1, Math.max(0, x2)),
    Math.min(1, Math.max(0, y2)),
  ];
}

type ContentBox = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

/**
 * Authenticated fall evidence image with an optional person decision box.
 * The Pi bakes the box into the JPEG; when metadata also carries
 * ``bbox_xyxy_norm`` we draw a CSS outline aligned to the letterboxed image.
 */
export function FallFrameImage({
  url,
  alt,
  className,
  bbox,
  confidence,
  label = 'FALL',
  fallback,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  bbox?: FallBBoxNorm | null;
  confidence?: number | null;
  label?: string;
  fallback?: ReactNode;
}) {
  const { src } = useAuthImage(url);
  const [content, setContent] = useState<ContentBox | null>(null);
  const hasBox = Array.isArray(bbox) && bbox.length === 4;

  const onImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!hasBox) return;
      const img = e.currentTarget;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const cw = img.clientWidth;
      const ch = img.clientHeight;
      if (!nw || !nh || !cw || !ch) return;
      const scale = Math.min(cw / nw, ch / nh);
      const dispW = nw * scale;
      const dispH = nh * scale;
      setContent({
        leftPct: ((cw - dispW) / 2 / cw) * 100,
        topPct: ((ch - dispH) / 2 / ch) * 100,
        widthPct: (dispW / cw) * 100,
        heightPct: (dispH / ch) * 100,
      });
    },
    [hasBox],
  );

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

  return (
    <div className={cn('relative', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full max-h-[inherit] w-full object-contain"
        onLoad={onImgLoad}
      />
      {hasBox && content && (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${content.leftPct}%`,
            top: `${content.topPct}%`,
            width: `${content.widthPct}%`,
            height: `${content.heightPct}%`,
          }}
        >
          <div
            className="absolute border-[3px] border-rose-500 shadow-[0_0_0_2px_rgba(0,0,0,0.55)]"
            style={{
              left: `${bbox[0] * 100}%`,
              top: `${bbox[1] * 100}%`,
              width: `${(bbox[2] - bbox[0]) * 100}%`,
              height: `${(bbox[3] - bbox[1]) * 100}%`,
            }}
          >
            <span className="absolute -top-6 start-0 whitespace-nowrap rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow">
              {label}
              {typeof confidence === 'number'
                ? ` ${Math.round(confidence * 100)}%`
                : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
