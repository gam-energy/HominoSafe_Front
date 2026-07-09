import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminChatSessionListResponse } from '../types/admin';

export interface AdminChatSessionsQuery {
  user_id?: number;
  patient_id?: number;
  status?: 'active' | 'archived';
  skip?: number;
  limit?: number;
}

const fetchChatSessions = async (query: AdminChatSessionsQuery = {}) => {
  const params: Record<string, unknown> = {
    skip: query.skip ?? 0,
    limit: query.limit ?? 50,
  };
  if (query.user_id != null) params.user_id = query.user_id;
  if (query.patient_id != null) params.patient_id = query.patient_id;
  if (query.status) params.status = query.status;

  const { data } = await axiosInstance.get<AdminChatSessionListResponse>(
    '/admin/chat-sessions',
    { params },
  );
  return data;
};

export function useGetChatSessions(query: AdminChatSessionsQuery = {}) {
  return useQuery({
    queryKey: [
      'admin-chat-sessions',
      query.user_id ?? '',
      query.patient_id ?? '',
      query.status ?? '',
      query.skip ?? 0,
      query.limit ?? 50,
    ],
    queryFn: () => fetchChatSessions(query),
  });
}
