import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";

import { MatrixMessageType } from "../types/chat.type";

export interface MatrixSyncTimeline {
  events: MatrixMessageType[];
}

export interface MatrixSyncRoom {
  timeline?: MatrixSyncTimeline;
}

export interface MatrixSyncRooms {
  join?: Record<string, MatrixSyncRoom>;
}

export interface MatrixSyncResponse {
  next_batch: string;
  rooms?: MatrixSyncRooms;
}

export const useRealtimeChatMessages = (roomId: string | null) => {
  const [messages, setMessages] = useState<MatrixMessageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const nextBatchRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      setError("No Matrix access token");
      setLoading(false);
      return;
    }

    let active = true;

    const fetchLoop = async () => {
      while (active) {
        try {
          abortControllerRef.current = new AbortController();

          const filter = JSON.stringify({
            room: {
              rooms: [roomId],
              timeline: { limit: 20, types: ["m.room.message"] },
            },
          });

          const { data } = await axiosInstance.get<MatrixSyncResponse>(
            "/synapse/sync",
            {
              headers: {
                "Synapse-Authorization": `Bearer ${accessToken}`,
              },
              params: {
                timeout: 30000,
                since: nextBatchRef.current || undefined,
                filter,
              },
              // Allow Synapse long-poll past the default 30s axios timeout.
              timeout: 45_000,
              signal: abortControllerRef.current.signal,
            }
          );

          nextBatchRef.current = data.next_batch;

          const events: MatrixMessageType[] =
            data.rooms?.join?.[roomId]?.timeline?.events || [];

          setMessages((prev) => {
            const combined = [...prev];
            for (const msg of events) {
              if (!combined.find((m) => m.event_id === msg.event_id)) {
                combined.push(msg);
              }
            }
            combined.sort((a, b) => a.origin_server_ts - b.origin_server_ts);
            return combined;
          });

          setLoading(false);
          setError(null);
        } catch (err: any) {
          if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;

          console.error("Matrix sync error:", err);
          setError(err.message || "Matrix sync failed");
          setLoading(false);

          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };

    fetchLoop();

    return () => {
      active = false;
      abortControllerRef.current?.abort();
    };
  }, [roomId]);

  return { messages, loading, error };
};
