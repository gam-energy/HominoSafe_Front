import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { SYNAPSE_HOMESERVER_URL } from "@/lib/constants";

export const useMatrixRooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      setError("No Matrix access token found");
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
      try {
        const syncResp = await axios.get(`${SYNAPSE_HOMESERVER_URL}/_matrix/client/r0/sync`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const joinedRooms = syncResp.data.rooms?.join || {};
        const roomList = Object.keys(joinedRooms).map((roomId) => ({
          roomId,
          name: joinedRooms[roomId].state?.events?.find(
            (e: any) => e.type === "m.room.name"
          )?.content?.name,
          lastEvent: joinedRooms[roomId].timeline?.events?.slice(-1)[0],
        }));

        setRooms(roomList);
      } catch (err: any) {
        setError(err.message || "Matrix API error");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return { rooms, loading, error };
};
