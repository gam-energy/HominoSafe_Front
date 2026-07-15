"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useMatrixMediaSrc } from "@/features/chat/hooks/use-matrix-media-src";

interface Props {
  name: string;
  src?: string;
  size?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  className?: string;
}

const AvatarWithBadge = ({
  name,
  src,
  isOnline,
  isGroup = false,
  size = "w-9 h-9",
  className,
}: Props) => {
  const imageSrc = useMatrixMediaSrc(src);

  return (
    <div className="relative shrink-0">
      <Avatar className={size}>
        {imageSrc ? <AvatarImage src={imageSrc} alt={name || "Avatar"} /> : null}
        <AvatarFallback
          className={cn(
            `bg-primary/10 text-primary font-semibold`,
            className && className
          )}
        >
          {name?.charAt(0)?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {isOnline && !isGroup && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
      )}
    </div>
  );
};

export default AvatarWithBadge;
