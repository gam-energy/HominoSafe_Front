"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMatrixProfileAvatar } from "@/features/chat/api/use-matrix-profile-avatar";
import { useMatrixMediaSrc } from "@/features/chat/hooks/use-matrix-media-src";
import { cn } from "@/lib/utils";

type Props = {
  /** App username / Matrix localpart. Omit for the signed-in user. */
  username?: string | null;
  /** Optional direct mxc:// or http(s) — skips profile lookup when set. */
  mxcUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
};

function initials(first?: string | null, last?: string | null, username?: string | null) {
  const a = first?.trim()?.[0] || "";
  const b = last?.trim()?.[0] || "";
  if (a || b) return `${a}${b}`.toUpperCase();
  return (username?.slice(0, 2) || "?").toUpperCase();
}

/** Avatar that loads the user's Matrix profile photo when available. */
export function MatrixAvatar({
  username,
  mxcUrl,
  firstName,
  lastName,
  className,
  fallbackClassName,
  alt,
}: Props) {
  const { avatarUrl } = useMatrixProfileAvatar(mxcUrl ? null : username);
  const src = useMatrixMediaSrc(mxcUrl || avatarUrl);
  const label =
    alt ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    username ||
    "User";

  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={label} /> : null}
      <AvatarFallback className={cn(fallbackClassName)}>
        {initials(firstName, lastName, username)}
      </AvatarFallback>
    </Avatar>
  );
}
