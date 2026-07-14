import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";
import { uploadMatrixMedia } from "@/features/chat/lib/matrix-media";

const synapseHeaders = (accessToken: string) => ({
  "Synapse-Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

type SendOptions = {
  msgtype?: string;
  url?: string;
  info?: Record<string, unknown>;
  txnId?: string;
};

export const useMatrixSendMessage = () => {
  const sendMessage = async (
    roomId: string,
    text: string,
    options: SendOptions = {}
  ) => {
    const accessToken = Cookies.get("synapse_access_token");
    if (!accessToken) {
      throw new Error("Matrix access token missing!");
    }

    const txnId = options.txnId || String(Date.now());
    const encodedRoomId = encodeURIComponent(roomId);

    const { data } = await axiosInstance.put(
      `/synapse/rooms/${encodedRoomId}/messages/send`,
      {
        msgtype: options.msgtype || "m.text",
        body: text,
        txn_id: txnId,
        url: options.url,
        info: options.info,
      },
      { headers: synapseHeaders(accessToken) }
    );

    return data;
  };

  const sendImage = async (roomId: string, file: File, caption?: string) => {
    const contentUri = await uploadMatrixMedia(file);
    return sendMessage(roomId, caption?.trim() || file.name || "image", {
      msgtype: "m.image",
      url: contentUri,
      info: {
        mimetype: file.type || "image/jpeg",
        size: file.size,
      },
    });
  };

  return { sendMessage, sendImage };
};
