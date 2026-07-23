import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { isValidUsername } from "../lib/credentials";

export type UsernameCheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

type CheckResponse = {
  username: string;
  available: boolean;
  reason?: string | null;
};

export function useUsernameAvailability(username: string, debounceMs = 450) {
  const [status, setStatus] = useState<UsernameCheckStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const reset = useCallback(() => {
    requestId.current += 1;
    setStatus("idle");
    setMessage(null);
  }, []);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setStatus("idle");
      setMessage(null);
      return;
    }
    if (!isValidUsername(trimmed)) {
      setStatus("invalid");
      setMessage(null);
      return;
    }

    const id = ++requestId.current;
    setStatus("checking");
    setMessage(null);

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get<CheckResponse>("/check-username", {
          params: { username: trimmed },
        });
        if (id !== requestId.current) return;
        if (data.available) {
          setStatus("available");
          setMessage(null);
        } else {
          setStatus("taken");
          setMessage(data.reason || "Username is already taken.");
        }
      } catch {
        if (id !== requestId.current) return;
        // Don't block submit on transient network errors; server still validates.
        setStatus("idle");
        setMessage(null);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [username, debounceMs]);

  return { status, message, reset };
}
