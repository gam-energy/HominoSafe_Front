'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';

export type SupportThread = {
  id: number;
  user_id: number;
  user_name?: string | null;
  status: string;
  subject?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  created_at: string;
};

export type SupportMessage = {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_name?: string | null;
  body: string;
  created_at: string;
};

export const supportKeys = {
  all: ['support'] as const,
  threads: ['support', 'threads'] as const,
  messages: (threadId: number) => ['support', 'messages', threadId] as const,
};

export async function fetchSupportThreads(): Promise<SupportThread[]> {
  const { data } = await axiosInstance.get<SupportThread[]>('/support/threads');
  return data;
}

export function useSupportThreads(enabled = true) {
  return useQuery({
    queryKey: supportKeys.threads,
    queryFn: fetchSupportThreads,
    enabled,
    refetchInterval: 15_000,
  });
}

export async function ensureMySupportThread(payload?: {
  subject?: string;
  body?: string;
}): Promise<SupportThread> {
  const { data } = await axiosInstance.post<SupportThread>(
    '/support/threads/me',
    payload ?? {},
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export function useEnsureMySupportThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ensureMySupportThread,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.threads });
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : error.message || 'Could not open support chat'
      );
    },
  });
}

export async function fetchSupportMessages(threadId: number): Promise<SupportMessage[]> {
  const { data } = await axiosInstance.get<SupportMessage[]>(
    `/support/threads/${threadId}/messages`
  );
  return data;
}

export function useSupportMessages(threadId: number | null) {
  return useQuery({
    queryKey: supportKeys.messages(threadId ?? 0),
    queryFn: () => fetchSupportMessages(threadId as number),
    enabled: !!threadId && threadId > 0,
    refetchInterval: 5_000,
  });
}

export async function postSupportMessage(
  threadId: number,
  body: string
): Promise<SupportMessage> {
  const { data } = await axiosInstance.post<SupportMessage>(
    `/support/threads/${threadId}/messages`,
    { body },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export function usePostSupportMessage(threadId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postSupportMessage(threadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.messages(threadId) });
      qc.invalidateQueries({ queryKey: supportKeys.threads });
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : error.message || 'Failed to send message'
      );
    },
  });
}
