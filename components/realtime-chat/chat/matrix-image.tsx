"use client";

import { useEffect, useState } from "react";
import { fetchMatrixMediaObjectUrl } from "@/features/chat/lib/matrix-media";

type Props = {
  mxcUrl: string;
  alt?: string;
  className?: string;
};

/** Renders an ``mxc://`` image via the authenticated Synapse media proxy. */
export default function MatrixImage({ mxcUrl, alt = "", className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        objectUrl = await fetchMatrixMediaObjectUrl(mxcUrl);
        if (!cancelled) setSrc(objectUrl);
      } catch (err) {
        console.error("Failed to load Matrix media", err);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mxcUrl]);

  if (!src) {
    return (
      <div
        className={
          className ||
          "rounded-lg max-w-xs h-32 bg-muted animate-pulse"
        }
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
