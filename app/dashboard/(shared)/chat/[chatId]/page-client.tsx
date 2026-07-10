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

import type {
  MatrixMessageType,
  MessageType,
  ChatType,
} from "@/features/chat/types/chat.type";
import { unknown } from "zod/v4";

const mapMatrixToMessage = (m: MatrixMessageType): MessageType => {
  return {
    _id: m.event_id,
    event_id: m.event_id,
    chatId: m.room_id,

    sender: {
      _id: m.sender,
      name: m.sender,
      avatar: null,
      username: "",
      createdAt: "",
      updatedAt: "",
    },

    text: m.content.msgtype === "m.text" ? m.content.body : null,
    image: m.content.msgtype === "m.image" ? m.content.url : null,
    file:
      m.content.msgtype === "m.file"
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
  const { socket } = useSocket();
  const currentUserId = user?.id || null;

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

  const lastMatrix = allMessages[allMessages.length - 1] || null;
  const lastMessage: MessageType | null = lastMatrix
    ? mapMatrixToMessage(lastMatrix)
    : null;

  const chatInfo: ChatType | null = chatRoom
    ? {
        room_id: decodedChatId,
        name: "",
        isGroup: false,
        member_count: 0,
        canonical_alias: "",
        avatar: "",
        _id: unknown,
        createdAt: "",
        lastMessage: null,
        groupName: "",
      }
    : null;

  useEffect(() => {
    if (!decodedChatId || !socket) return;

    socket.emit("chat:join", decodedChatId);

    return () => {
      socket.emit("chat:leave", decodedChatId);
    };
  }, [decodedChatId, socket]);

  const uiMessages: MessageType[] = useMemo(() => {
    return allMessages
      .map(mapMatrixToMessage)
      .filter((m) => !!m.text || !!m.image || !!m.file);
  }, [allMessages]);

  if (matrixLoading || roomsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!matrixInitialMessages && allMessages.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Chat not found</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {chatInfo && (
        <ChatHeader chat={chatInfo} currentUserId={currentUserId} />
      )}

      <div className="flex-1 overflow-y-auto bg-background">
        {allMessages.length === 0 ? (
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
