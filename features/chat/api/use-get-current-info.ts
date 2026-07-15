// hooks/useGetCurrentUser.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import Cookies from "js-cookie";

import { ChatUserType } from "@/features/chat/types/chat.type";

/* =======================================================
   Matrix /whoami response type
======================================================= */
type MatrixWhoAmIResponse = {
  user_id: string; // @user:server
  device_id?: string;
  is_guest?: boolean;
  displayname?: string | null;
  avatar_url?: string | null;
};

/* =======================================================
   Fetch current user from Matrix
======================================================= */
const fetchCurrentUser = async (): Promise<ChatUserType> => {
  const matrix_access_token = Cookies.get("synapse_access_token");

  if (!matrix_access_token) {
    throw new Error("No access token found");
  }

  const { data } = await axiosInstance.get<MatrixWhoAmIResponse>(
    "/synapse/whoami",
    {
      headers: {
        "Content-Type": "application/json",
        "Synapse-Authorization": `Bearer ${matrix_access_token}`,
      },
    }
  );

  const now = new Date().toISOString();
  const localpart =
    data.user_id?.split(":")[0]?.replace(/^@/, "") || data.user_id;
  const displayName = data.displayname || localpart;

  return {
    _id: data.user_id,
    username: localpart,
    name: displayName,
    matrixId: data.user_id,

    avatar: data.avatar_url || undefined,
    email: undefined,

    isOnline: true,
    createdAt: now,
    updatedAt: now,
  };
};

/* =======================================================
   Hook
======================================================= */
export const useGetCurrentUser = (): UseQueryResult<
  ChatUserType,
  AxiosError
> => {
  return useQuery<ChatUserType, AxiosError>({
    queryKey: ["whoami"],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5,
  });
};
