import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/hooks/realtime-chat/use-socket";
import type { ChatType } from "@/features/chat/types/chat.type";

export const isUserOnline = (userId?: string) => {
  if (!userId) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
  chat: ChatType,
  currentUserId: string | null
) => {
  const isGroup = Boolean(chat?.isGroup);

  if (isGroup) {
    return {
      name: chat.groupName || chat.name || "Unnamed Group",
      subheading: `${chat.member_count || chat.participants?.length || 0} members`,
      avatar: chat.avatar || "",
      isGroup: true,
    };
  }

  const other = chat?.participants?.find((p) => p._id !== currentUserId);
  const name =
    chat.name ||
    chat.groupName ||
    other?.name ||
    other?.username ||
    "Chat";
  const isOnline = other?._id ? isUserOnline(other._id) : false;

  return {
    name,
    subheading: isOnline ? "Online" : "Chat",
    avatar: chat.avatar || other?.avatar || "",
    isGroup: false,
    isOnline,
  };
};

export const formatChatTime = (date: string | Date) => {
  if (!date) return "";
  const newDate = new Date(date);
  if (isNaN(newDate.getTime())) return "Invalid date";

  if (isToday(newDate)) return format(newDate, "h:mm a");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};

export function generateUUID(): string {
  return uuidv4();
}
