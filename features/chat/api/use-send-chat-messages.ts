import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";

const synapseHeaders = (accessToken: string) => ({
  "Synapse-Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

export const useMatrixSendMessage = () => {
  const sendMessage = async (roomId: string, text: string) => {
    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      throw new Error("Matrix access token missing!");
    }

    const txnId = String(Date.now());
    const encodedRoomId = encodeURIComponent(roomId);

    const { data } = await axiosInstance.put(
      `/synapse/rooms/${encodedRoomId}/messages/send`,
      {
        msgtype: "m.text",
        body: text,
        txn_id: txnId,
      },
      { headers: synapseHeaders(accessToken) }
    );

    return data;
  };

  return { sendMessage };
};
