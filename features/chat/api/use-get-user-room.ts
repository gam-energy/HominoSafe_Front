import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";

type UnifiedRoom = {
  room_id: string;
  name?: string | null;
};

type UnifiedRoomsResponse = {
  joined: UnifiedRoom[];
  invited?: UnifiedRoom[];
  total?: number;
};

export const useMatrixRooms = () => {
  const [rooms, setRooms] = useState<
    { roomId: string; name?: string | null; lastEvent?: unknown }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      setError("No Matrix access token found");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRooms = async () => {
      try {
        const { data } = await axiosInstance.get<UnifiedRoomsResponse>(
          "/synapse/rooms/unified",
          {
            headers: {
              "Synapse-Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (!cancelled) {
          setRooms(
            (data.joined || []).map((r) => ({
              roomId: r.room_id,
              name: r.name,
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Matrix API error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, loading, error };
};
