"use client";

import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";
import { useGetCurrentUser } from "@/features/chat/api/use-get-current-info";

type ResolveResponse = {
  mxid: string;
  displayname?: string | null;
  avatar_url?: string | null;
};

function localpart(mxidOrUser?: string | null): string {
  if (!mxidOrUser) return "";
  return mxidOrUser.split(":")[0]?.replace(/^@/, "") || mxidOrUser;
}

/**
 * Resolve a Matrix profile ``avatar_url`` (mxc://) for the current user
 * or another user by username / localpart.
 */
export function useMatrixProfileAvatar(username?: string | null) {
  const { data: me, isLoading: meLoading } = useGetCurrentUser();
  const meLocal = localpart(me?.username || me?.matrixId);
  const target = username ? localpart(username) : meLocal;
  const isSelf = !username || !meLocal || target === meLocal;

  const resolve = useQuery({
    queryKey: ["matrix-profile-avatar", target],
    enabled: !!target && !isSelf && !!Cookies.get("synapse_access_token"),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const token = Cookies.get("synapse_access_token");
      if (!token) throw new Error("Matrix access token missing");
      const { data } = await axiosInstance.get<ResolveResponse>(
        "/synapse/resolve",
        {
          params: { username: target },
          headers: {
            "Synapse-Authorization": `Bearer ${token}`,
          },
        }
      );
      return data.avatar_url || null;
    },
  });

  if (isSelf) {
    return {
      avatarUrl: me?.avatar || null,
      isLoading: meLoading,
    };
  }

  return {
    avatarUrl: resolve.data ?? null,
    isLoading: resolve.isLoading,
  };
}
