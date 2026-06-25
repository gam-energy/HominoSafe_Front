import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export const CreateRoomButton = () => {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState(""); // comma separated @user:server
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName) {
      setError("Room name is required");
      return;
    }
    setLoading(true);
    setError(null);

    const adminAccessToken = Cookies.get("matrix_access_token");
    if (!adminAccessToken) {
      setError("Matrix access token not found in cookies");
      setLoading(false);
      return;
    }

    try {
      // اگر participants پر شد، آرایه بساز و به invite اضافه کن
      const payload: any = {
        name: roomName,
        preset: "private_chat",
        is_direct: false,
      };
      const participantList = participants
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      if (participantList.length > 0) {
        payload.invite = participantList;
      }

      await axios.post(
        "http://0.0.0.0:8008/_matrix/client/v3/createRoom",
        payload,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRoomName("");
      setParticipants("");
      setOpen(false);
      alert("Room created successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/80"
        onClick={() => setOpen(true)}
      >
        New Room
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>

            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />

            <input
              type="text"
              placeholder="Participants (comma separated, optional)"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />

            {error && <p className="text-red-500 mb-3">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/80"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
