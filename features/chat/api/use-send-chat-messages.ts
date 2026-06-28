// hooks/matrix/use-matrix-send-message.ts
import axios from "axios";
import Cookies from "js-cookie";
import { SYNAPSE_HOMESERVER_URL } from "@/lib/constants";

export const useMatrixSendMessage = () => {
  const sendMessage = async (roomId: string, text: string) => {
    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      throw new Error("Matrix access token missing!");
    }

    const txnId = Date.now(); // unique transaction ID

    const url = `${SYNAPSE_HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${txnId}`;

    const payload = {
      msgtype: "m.text",
      body: text,
    };

    const response = await axios.put(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  };

  return { sendMessage };
};
