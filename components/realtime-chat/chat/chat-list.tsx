// "use client";

// import { useEffect, useState } from "react";
// import { useChat } from "@/hooks/realtime-chat/use-chat";
// import { Spinner } from "../ui/spinner";
// import ChatListItem from "./chat-list-item";
// import { useAuth } from "@/hooks/realtime-chat/use-auth";
// import ChatListHeader from "./chat-list-header";
// import { useSocket } from "@/hooks/realtime-chat/use-socket";
// import type { ChatType, MessageType } from "@/features/chat/types/chat.type";
// import { useRouter } from "next/navigation";

// const ChatList = () => {
//   const router = useRouter();
//   const { socket } = useSocket();
//   const {
//     fetchChats,
//     chats,
//     isChatsLoading,
//     addNewChat,
//     updateChatLastMessage,
//   } = useChat();
//   const { user } = useAuth();
//   const currentUserId = user?._id || null;

//   const [searchQuery, setSearchQuery] = useState("");

//   const filteredChats =
//     chats?.filter(
//       (chat) =>
//         chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         chat.participants?.some(
//           (p: { _id: any; name: string; }) =>
//             p._id !== currentUserId &&
//             p.name?.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//     ) || [];

//   // 📦 Fetch chats on mount
//   useEffect(() => {
//     fetchChats();
//   }, [fetchChats]);

//   // 🆕 Listen for new chats
//   useEffect(() => {
//     if (!socket) return;

//     const handleNewChat = (newChat: ChatType) => {
//       console.log("Received new chat", newChat);
//       addNewChat(newChat);
//     };

//     socket.on("chat:new", handleNewChat);
//     return () => {
//       socket.off("chat:new", handleNewChat);
//     };
//   }, [addNewChat, socket]);

//   // 🔄 Listen for chat updates
//   useEffect(() => {
//     if (!socket) return;

//     const handleChatUpdate = (data: {
//       chatId: string;
//       lastMessage: MessageType;
//     }) => {
//       console.log("Received update on chat", data.lastMessage);
//       updateChatLastMessage(data.chatId, data.lastMessage);
//     };

//     socket.on("chat:update", handleChatUpdate);
//     return () => {
//       socket.off("chat:update", handleChatUpdate);
//     };
//   }, [socket, updateChatLastMessage]);

//   const onRoute = (id: string) => {
//     router.push(`/chat/${id}`);
//   };

//   return (
//     <div
//       className=" pb-20 lg:pb-0 lg:max-w-[379px] lg:block border-r border-border bg-sidebar max-w-[calc(100%-40px)] w-full left-10 z-[98]"
//     >
//       <div className="flex-col">
//         <ChatListHeader onSearch={setSearchQuery} />

//         <div className="flex-1 h-[calc(100vh-100px)] overflow-y-auto">
//           <div className="px-2 pb-10 pt-1 space-y-1">
//             {isChatsLoading ? (
//               <div className="flex items-center justify-center">
//                 <Spinner className="w-7 h-7" />
//               </div>
//             ) : filteredChats?.length === 0 ? (
//               <div className="flex items-center justify-center">
//                 {searchQuery ? "No chat found" : "No chats created"}
//               </div>
//             ) : (
//               filteredChats?.map((chat) => (
//                 <ChatListItem
//                   key={chat._id}
//                   chat={chat}
//                   currentUserId={currentUserId}
//                   onClick={() => onRoute(chat._id)}
//                 />
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatList;
import { useEffect, useState } from "react";
import { useGetRooms } from "@/features/chat/api/use-get-rooms";
import { useEnsureCareTeamRooms } from "@/features/chat/api/useEnsureCareTeamRooms";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import InviteListItem from "./InviteListItem";
import { useAuth } from "@/hooks/realtime-chat/use-auth";
import ChatListHeader from "./chat-list-header";
import { useRouter } from "next/navigation";
import { unknown } from "zod/v4";

const ChatList = () => {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetRooms();
  const ensureRooms = useEnsureCareTeamRooms();
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const [searchQuery, setSearchQuery] = useState("");

  // Provision patient↔doctor / patient↔caregiver DMs once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureRooms.mutateAsync();
        if (!cancelled) await refetch();
      } catch {
        /* token missing or synapse offline — list still loads */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinedRooms = data?.joined || [];
  const invitedRooms = data?.invited || [];

  const filteredJoined = joinedRooms.filter((room) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvited = invitedRooms.filter((room) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRoute = (id: string) => router.push(`/dashboard/chat/${id}`);

  if (error) console.error("Matrix rooms error:", error);

  return (
    <div className="pb-20 lg:pb-0 lg:max-w-[379px] border-r border-border bg-sidebar">
      <ChatListHeader onSearch={setSearchQuery} />

      <div className="h-[calc(100vh-100px)] overflow-y-auto px-2 pb-10 pt-1 space-y-3">

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Spinner className="w-7 h-7" />
          </div>
        ) : (
          <>
            {/* JOINED ROOMS */}
            {filteredJoined.length > 0 && (
              <div className="space-y-1">
                {filteredJoined.map((room) => (
                  <ChatListItem
                    key={room.room_id}
                    chat={{
                      room_id: room.room_id,
                      groupName: room.name || "Unnamed Room",
                      participants: [],
                      lastMessage: null,
                      isGroup: false,
                      avatar: "",
                      createdAt: "",
                      _id: unknown,
                      name: "",
                      member_count: 0
                    }}
                    currentUserId={currentUserId}
                    onClick={() => onRoute(room.room_id)}
                  />
                ))}
              </div>
            )}

            {/* INVITED ROOMS */}
            {filteredInvited.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs text-gray-500 px-1">Invitations</h4>
                {filteredInvited.map((room) => (
                  <InviteListItem key={room.room_id} room={room} />
                ))}
              </div>
            )}

            {/* EMPTY STATES */}
            {filteredJoined.length === 0 && filteredInvited.length === 0 && (
              <div className="flex items-center justify-center">
                {searchQuery ? "No rooms found" : "No rooms available"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
