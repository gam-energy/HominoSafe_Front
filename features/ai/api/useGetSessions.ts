// hooks/useHistory.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';

export type SessionItem = {
  session_id: string;
  created_at: string;
  title?: string;
  last_message_at?: string;
  status?: 'active' | 'archived' | string;
};

export type SessionResponse = {
  sessions: SessionItem[];
};

const fetchSessions = async (): Promise<SessionResponse> => {
  const response = await axiosInstance.get<SessionResponse>('/api/v1/chatbot/sessions');

  if (response.status !== 200) {
    throw new Error('Failed to fetch sessions');
  }

  return response.data;
};

export type UseHistoryResult = UseQueryResult<SessionResponse, AxiosError>;

export const GetSessions = (): UseHistoryResult => {
  return useQuery<SessionResponse, AxiosError>({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    staleTime: 1000 * 60 * 5,
  });
};
