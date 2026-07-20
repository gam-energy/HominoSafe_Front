"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetRooms } from "@/features/chat/api/use-get-rooms";
import { useEnsureCareTeamRooms } from "@/features/chat/api/useEnsureCareTeamRooms";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import InviteListItem from "./InviteListItem";
import { useAuth } from "@/hooks/realtime-chat/use-auth";
import ChatListHeader from "./chat-list-header";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import {
  useEnsureMySupportThread,
  useSupportThreads,
} from "@/features/support/api/use-support";

const ChatList = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error, refetch } = useGetRooms();
  const ensureRooms = useEnsureCareTeamRooms();
  const { user: matrixUser } = useAuth();
  const { user, role } = useUser();
  const currentUserId = matrixUser?.id || null;
  const isAdmin = role === "admin";
  const { data: supportThreads } = useSupportThreads(!!user);
  const ensureSupport = useEnsureMySupportThread();

  const [searchQuery, setSearchQuery] = useState("");
  const [openingSupport, setOpeningSupport] = useState(false);

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

  const filteredSupport =
    supportThreads?.filter((thread) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (thread.user_name || "").toLowerCase().includes(q) ||
        (thread.subject || "").toLowerCase().includes(q) ||
        (thread.last_message_preview || "").toLowerCase().includes(q)
      );
    }) || [];

  const onRoute = (id: string) => router.push(`/dashboard/chat/${id}`);

  const openMySupport = async () => {
    if (openingSupport) return;
    setOpeningSupport(true);
    try {
      const thread = await ensureSupport.mutateAsync({});
      router.push(`/dashboard/chat/support/${thread.id}`);
    } catch {
      /* toast in hook */
    } finally {
      setOpeningSupport(false);
    }
  };

  if (error) console.error("Matrix rooms error:", error);

  const supportActive = pathname?.includes("/dashboard/chat/support");

  return (
    <div className="pb-20 lg:pb-0 lg:max-w-[379px] border-r border-border bg-sidebar">
      <ChatListHeader onSearch={setSearchQuery} />

      <div className="h-[calc(100vh-100px)] overflow-y-auto px-2 pb-10 pt-1 space-y-3">
        {/* Pinned: Chat with admin (non-admin) */}
        {!isAdmin && !!user && (
          <button
            type="button"
            onClick={openMySupport}
            disabled={openingSupport}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-sm hover:bg-sidebar-accent transition-colors text-left border border-border/60 bg-card/40",
              supportActive && "!bg-sidebar-accent"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold truncate">
                {t("support_chat_with_admin")}
              </h5>
              <p className="text-xs truncate text-muted-foreground">
                {openingSupport
                  ? t("support_chat_opening")
                  : supportThreads?.[0]?.last_message_preview ||
                    t("support_chat_pin_hint")}
              </p>
            </div>
          </button>
        )}

        {/* Admin support inbox */}
        {isAdmin && (
          <div className="space-y-1">
            <h4 className="text-xs text-muted-foreground px-1">
              {t("support_inbox")}
            </h4>
            {filteredSupport.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-1">
                {t("support_inbox_empty")}
              </p>
            ) : (
              filteredSupport.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/chat/support/${thread.id}`)
                  }
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-sm hover:bg-sidebar-accent transition-colors text-left",
                    pathname?.includes(`/support/${thread.id}`) &&
                      "!bg-sidebar-accent"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="text-sm font-semibold truncate">
                        {thread.user_name ||
                          thread.subject ||
                          t("support_chat_admin_title")}
                      </h5>
                      {thread.last_message_at ? (
                        <span className="text-xs ml-2 shrink-0 text-muted-foreground">
                          {new Date(thread.last_message_at).toLocaleTimeString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      {thread.last_message_preview || t("support_chat_empty")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Spinner className="w-7 h-7" />
          </div>
        ) : (
          <>
            {/* JOINED ROOMS */}
            {filteredJoined.length > 0 && (
              <div className="space-y-1">
                {isAdmin && (
                  <h4 className="text-xs text-muted-foreground px-1">
                    {t("realtime_chat")}
                  </h4>
                )}
                {filteredJoined.map((room) => (
                  <ChatListItem
                    key={room.room_id}
                    chat={{
                      room_id: room.room_id,
                      groupName: room.name || "Unnamed Room",
                      participants: [],
                      lastMessage: null,
                      isGroup: false,
                      avatar: room.avatar_url || "",
                      createdAt: "",
                      _id: room.room_id,
                      name: room.name || "",
                      member_count: room.member_count || 0,
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
            {filteredJoined.length === 0 &&
              filteredInvited.length === 0 &&
              !isAdmin && (
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
