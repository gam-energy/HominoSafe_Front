"use client";

import { useEffect, useState } from "react";
import { fetchMatrixMediaObjectUrl } from "@/features/chat/lib/matrix-media";

/**
 * Resolve an ``mxc://`` URI (or pass-through http(s)/blob) into a displayable
 * image ``src`` for avatars and thumbnails.
 */
export function useMatrixMediaSrc(src?: string | null): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(() => {
    if (!src) return undefined;
    if (src.startsWith("mxc://")) return undefined;
    return src;
  });

  useEffect(() => {
    if (!src) {
      setResolved(undefined);
      return;
    }
    if (!src.startsWith("mxc://")) {
      setResolved(src);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        objectUrl = await fetchMatrixMediaObjectUrl(src);
        if (!cancelled) setResolved(objectUrl);
      } catch {
        if (!cancelled) setResolved(undefined);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolved;
}
