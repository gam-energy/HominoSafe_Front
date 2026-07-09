import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminChatMessagesResponse } from '../types/admin';

export interface AdminChatMessagesQuery {
  limit?: number;
  offset?: number;
}

const fetchChatSessionMessages = async (
  sessionId: string,
  query: AdminChatMessagesQuery = {},
) => {
  const { data } = await axiosInstance.get<AdminChatMessagesResponse>(
    `/admin/chat-sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      params: {
        limit: query.limit ?? 1000,
        offset: query.offset ?? 0,
      },
    },
  );
  return data;
};

export function useGetChatSessionMessages(
  sessionId: string | undefined,
  query: AdminChatMessagesQuery = {},
) {
  return useQuery({
    queryKey: [
      'admin-chat-session-messages',
      sessionId,
      query.limit ?? 1000,
      query.offset ?? 0,
    ],
    queryFn: () => fetchChatSessionMessages(sessionId as string, query),
    enabled: !!sessionId,
  });
}
