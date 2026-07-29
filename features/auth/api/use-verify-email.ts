import axiosInstance from '@/api/axiosInstance';
import { useMutation } from '@tanstack/react-query';

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (payload: { identifier: string; code: string }) => {
      const { data } = await axiosInstance.post<{
        message: string;
        email_verified: boolean;
      }>('/verify-email', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
  });
}

export function useResendVerifyEmail() {
  return useMutation({
    mutationFn: async (identifier: string) => {
      const { data } = await axiosInstance.post<{
        message: string;
        expires_in_seconds?: number;
      }>(
        '/verify-email/resend',
        { identifier },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
  });
}
