import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";

import { MatrixMessageType } from "../types/chat.type";

export interface MatrixRoomMessagesResponse {
  start?: string;
  end?: string;
  chunk: MatrixMessageType[];
}

export const useChatMessages = (roomId: string | null) => {
  const [messages, setMessages] = useState<MatrixMessageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      setError("No Matrix access token found");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await axiosInstance.get<MatrixRoomMessagesResponse>(
          `/synapse/rooms/${encodeURIComponent(roomId)}/messages`,
          {
            headers: {
              "Synapse-Authorization": `Bearer ${accessToken}`,
            },
            params: {
              dir: "b",
              limit: 50,
            },
          }
        );

        if (!cancelled) {
          // History is fetched backward; keep only message events, chronological.
          const chunk = [...(data.chunk || [])]
            .filter(
              (e: MatrixMessageType & { type?: string }) =>
                e.type === "m.room.message" || Boolean(e.content?.msgtype)
            )
            .reverse();
          setMessages(chunk);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch Matrix messages");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return { messages, loading, error };
};
