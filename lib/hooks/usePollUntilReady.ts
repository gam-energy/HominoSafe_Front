"use client";

import { useEffect, useRef, useState } from "react";

type PollOptions<T> = {
  enabled: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  isReady: (data: T | undefined) => boolean;
  isFailed?: (data: T | undefined) => boolean;
  fetchFn: () => Promise<T>;
  onReady?: (data: T) => void;
  onFailed?: (data: T | undefined) => void;
  onTimeout?: () => void;
};

export function usePollUntilReady<T>({
  enabled,
  intervalMs = 2500,
  timeoutMs = 120_000,
  isReady,
  isFailed,
  fetchFn,
  onReady,
  onFailed,
  onTimeout,
}: PollOptions<T>) {
  const [data, setData] = useState<T | undefined>();
  const [isPolling, setIsPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const callbacksRef = useRef({ onReady, onFailed, onTimeout, isReady, isFailed, fetchFn });

  useEffect(() => {
    callbacksRef.current = { onReady, onFailed, onTimeout, isReady, isFailed, fetchFn };
  });

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const result = await callbacksRef.current.fetchFn();
        if (cancelled) return;

        setData(result);
        setError(null);

        if (callbacksRef.current.isReady(result)) {
          setIsPolling(false);
          if (intervalId) clearInterval(intervalId);
          callbacksRef.current.onReady?.(result);
          return;
        }

        if (callbacksRef.current.isFailed?.(result)) {
          setIsPolling(false);
          if (intervalId) clearInterval(intervalId);
          callbacksRef.current.onFailed?.(result);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          setIsPolling(false);
          setTimedOut(true);
          if (intervalId) clearInterval(intervalId);
          callbacksRef.current.onTimeout?.();
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Polling failed"));
      }
    };

    setIsPolling(true);
    setTimedOut(false);
    void poll();
    intervalId = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [enabled, intervalMs, timeoutMs]);

  return { data, isPolling, timedOut, error };
}
