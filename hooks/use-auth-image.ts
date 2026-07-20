'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/api/axiosInstance';

/**
 * Load an authenticated same-origin image (e.g. fall frames) via axios so the
 * Bearer token is sent — plain <img src> only sends cookies and often 401s.
 */
export function useAuthImage(url: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setSrc(null);
    setFailed(false);

    if (!url) return undefined;

    if (url.startsWith('data:') || url.startsWith('blob:')) {
      setSrc(url);
      return undefined;
    }

    (async () => {
      try {
        const { data } = await axiosInstance.get<Blob>(url, {
          responseType: 'blob',
          headers: { 'Content-Type': 'application/json' },
          timeout: 15_000,
        });
        if (cancelled) return;
        if (!data || data.type.startsWith('application/json')) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { src: failed ? null : src, failed };
}
