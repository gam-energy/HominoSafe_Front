"use client";

import { getOtherUserAndGroup } from "@/lib/realtime-chat/helper";
import type { ChatType } from "@/features/chat/types/chat.type";
import { ArrowLeft } from "lucide-react";
import AvatarWithBadge from "../avatar-with-badge";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = ({ chat, currentUserId }: ChatHeaderProps) => {
  const router = useRouter();

  const { name, subheading, avatar, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId
  );

  return (
    <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 py-2.5 z-50 h-16">
      <div className="flex items-center gap-3">
        <ArrowLeft
          className="w-5 h-5 inline-block lg:hidden text-muted-foreground hover:text-foreground cursor-pointer transition-colors me-1"
          onClick={() => router.push("/dashboard/chat")}
        />

        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
        />

        <div className="flex flex-col">
          <h5 className="font-bold text-sm text-foreground leading-none mb-1">{name}</h5>
          <p className="text-xs text-muted-foreground leading-none">
            {subheading}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Optional header actions can go here in the future */}
      </div>
    </div>
  );
};

export default ChatHeader;
