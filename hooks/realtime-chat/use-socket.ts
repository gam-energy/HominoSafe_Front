import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { getApiBaseUrl } from "@/lib/api-utils";

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const { socket } = get();
    console.log(socket, "socket");
    if (socket?.connected) return;

    const baseUrl =
      getApiBaseUrl() ||
      (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8888");

    const newSocket = io(baseUrl, {
      withCredentials: true,
      autoConnect: true,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
    });

    newSocket.on("online:users", (userIds) => {
      console.log("Online users", userIds);
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
