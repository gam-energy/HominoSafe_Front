import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";
import type { UserType } from "@/features/chat/types/auth.type";

type ContactItem = {
  user_id: string;
  dm_room_id?: string | null;
  displayname?: string | null;
  avatar_url?: string | null;
};

type ContactListResponse = {
  contacts: ContactItem[];
};

/** Map Matrix contacts into the shape New Chat expects. */
function toChatUsers(contacts: ContactItem[]): UserType[] {
  return contacts.map((c) => {
    const localpart = c.user_id.split(":")[0]?.replace(/^@/, "") || c.user_id;
    const name = c.displayname || localpart;
    return {
      _id: localpart,
      id: localpart,
      username: localpart,
      name,
      email: "",
      avatar: c.avatar_url || null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  });
}

export function useChatContacts(enabled = true) {
  return useQuery({
    queryKey: ["synapse-contacts"],
    enabled,
    queryFn: async () => {
      const token = Cookies.get("synapse_access_token");
      if (!token) {
        throw new Error("Matrix access token missing");
      }
      const { data } = await axiosInstance.get<ContactListResponse>(
        "/synapse/contacts",
        {
          headers: {
            "Synapse-Authorization": `Bearer ${token}`,
          },
        }
      );
      return toChatUsers(data.contacts || []);
    },
    staleTime: 1000 * 60 * 5,
  });
}
