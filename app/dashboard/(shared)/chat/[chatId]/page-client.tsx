"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

import ChatBody from "@/components/realtime-chat/chat/chat-body";
import ChatFooter from "@/components/realtime-chat/chat/chat-footer";
import ChatHeader from "@/components/realtime-chat/chat/chat-header";
import EmptyState from "@/components/realtime-chat/empty-state";
import { Spinner } from "@/components/realtime-chat/ui/spinner";

import { useAuth } from "@/hooks/realtime-chat/use-auth";
import { useSocket } from "@/hooks/realtime-chat/use-socket";

import { useChatMessages } from "@/features/chat/api/use-get-chat-messages";
import { useRealtimeChatMessages } from "@/features/chat/api/use-realtime-chat";
import { useMatrixRooms } from "@/features/chat/api/use-get-user-room";
import { useGetRooms } from "@/features/chat/api/use-get-rooms";
import { useChatContacts } from "@/features/chat/api/use-get-contacts";
import { useGetCurrentUser } from "@/features/chat/api/use-get-current-info";

import type {
  MatrixMessageType,
  MessageType,
  ChatType,
} from "@/features/chat/types/chat.type";

const localpartOf = (mxid?: string | null) =>
  mxid?.split(":")[0]?.replace(/^@/, "") || mxid || "";

const mapMatrixToMessage = (
  m: MatrixMessageType,
  avatarByMxid: Map<string, string>
): MessageType => {
  const msgtype = m.content?.msgtype;
  const senderId = m.sender || "";
  const avatar =
    avatarByMxid.get(senderId) ||
    avatarByMxid.get(localpartOf(senderId)) ||
    null;

  return {
    _id: m.event_id,
    event_id: m.event_id,
    chatId: m.room_id,

    sender: {
      _id: m.sender,
      name: localpartOf(m.sender) || m.sender,
      avatar,
      username: localpartOf(m.sender) || "",
      createdAt: "",
      updatedAt: "",
    },

    text: msgtype === "m.text" || msgtype === "m.notice" ? m.content.body : null,
    image: msgtype === "m.image" ? m.content.url : null,
    file:
      msgtype === "m.file"
        ? { url: m.content.url, name: m.content.body }
        : null,

    matrixContent: m.content,

    replyTo: m.replyToEventId ? { event_id: m.replyToEventId } : null,

    createdAt: new Date(m.origin_server_ts).toISOString(),
    updatedAt: new Date(m.origin_server_ts).toISOString(),

    status: m.status,
    streaming: m.streaming,
  };
};

export default function SingleChatPageClient() {
  const { chatId } = useParams<{ chatId: string }>();
  const decodedChatId = decodeURIComponent(chatId);

  const { user } = useAuth();
  const { data: matrixUser } = useGetCurrentUser();
  const { data: contacts } = useChatContacts(true);
  const { socket } = useSocket();
  const currentUserId = user?.id || matrixUser?._id || null;

  const [replyTo, setReplyTo] = useState<MatrixMessageType | null>(null);

  const handleReplyFromUI = (msg: MessageType) => {
    if (!msg.event_id || !msg.matrixContent) return;

    const matrixMsg: MatrixMessageType = {
      event_id: msg.event_id,
      sender: msg.sender?._id || "unknown",
      content: msg.matrixContent || { msgtype: "m.text", body: "" },
      origin_server_ts: new Date(msg.createdAt || Date.now()).getTime(),
      room_id: msg.chatId,
    };

    setReplyTo(matrixMsg);
  };

  const {
    messages: matrixInitialMessages,
    loading: matrixLoading,
  } = useChatMessages(decodedChatId);

  const { messages: realtimeMatrixMessages } =
    useRealtimeChatMessages(decodedChatId);

  const { rooms, loading: roomsLoading } = useMatrixRooms();
  const { data: unifiedRooms } = useGetRooms();

  const avatarByMxid = useMemo(() => {
    const map = new Map<string, string>();
    if (matrixUser?.matrixId && matrixUser.avatar) {
      map.set(matrixUser.matrixId, matrixUser.avatar);
      map.set(localpartOf(matrixUser.matrixId), matrixUser.avatar);
    }
    for (const c of contacts || []) {
      if (!c.avatar) continue;
      // Contacts use localpart as _id; also index raw if present.
      map.set(c._id, c.avatar);
      map.set(c.username || c._id, c.avatar);
      if (c.id) map.set(String(c.id), c.avatar);
    }
    return map;
  }, [contacts, matrixUser]);

  const allMessages: MatrixMessageType[] = useMemo(() => {
    const combined = [...matrixInitialMessages, ...realtimeMatrixMessages];
    const map = new Map<string, MatrixMessageType>();

    combined.forEach((msg) => {
      if (!map.has(msg.event_id)) map.set(msg.event_id, msg);
    });

    return Array.from(map.values()).sort(
      (a, b) => a.origin_server_ts - b.origin_server_ts
    );
  }, [matrixInitialMessages, realtimeMatrixMessages]);

  const chatRoom = rooms.find((r) => r.roomId === decodedChatId);
  const unifiedRoom = (unifiedRooms?.joined || []).find(
    (r: { room_id: string }) => r.room_id === decodedChatId
  );
  const roomTitle = chatRoom?.name || unifiedRoom?.name || "Chat";
  const roomAvatar =
    (unifiedRoom as { avatar_url?: string } | undefined)?.avatar_url || "";

  const chatInfo = {
    room_id: decodedChatId,
    name: roomTitle,
    groupName: roomTitle,
    isGroup: false,
    member_count: 2,
    canonical_alias: "",
    avatar: roomAvatar,
    createdAt: "",
    lastMessage: null,
    participants: [],
    _id: decodedChatId,
  } as unknown as ChatType;

  useEffect(() => {
    if (!decodedChatId || !socket) return;

    socket.emit("chat:join", decodedChatId);

    return () => {
      socket.emit("chat:leave", decodedChatId);
    };
  }, [decodedChatId, socket]);

  const uiMessages: MessageType[] = useMemo(() => {
    return allMessages
      .map((m) => mapMatrixToMessage(m, avatarByMxid))
      .filter((m) => !!m.text || !!m.image || !!m.file);
  }, [allMessages, avatarByMxid]);

  if (matrixLoading || roomsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <ChatHeader chat={chatInfo} currentUserId={currentUserId} />

      <div className="flex-1 overflow-y-auto bg-background">
        {uiMessages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="No messages yet. Send the first message"
          />
        ) : (
          <ChatBody
            chatId={decodedChatId}
            messages={uiMessages}
            onReply={handleReplyFromUI}
          />
        )}
      </div>

      <ChatFooter chatId={decodedChatId} currentUserId={currentUserId} />
    </div>
  );
}
