import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

// --------------------------------------------
//  IMPORT مدل استاندارد پیام ماتریکس
// --------------------------------------------
import { MatrixMessageType } from "../types/chat.type";

const MATRIX_HOMESERVER_URL = "http://0.0.0.0:8008";

// پاسخ API ماتریکس برای /messages
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

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get<MatrixRoomMessagesResponse>(
          `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/messages`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              dir: "b", // backward
              limit: 50
            }
          }
        );

        setMessages(resp.data.chunk || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch Matrix messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  return { messages, loading, error };
};
