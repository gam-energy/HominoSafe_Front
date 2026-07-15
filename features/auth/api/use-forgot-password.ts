import axiosInstance from '@/api/axiosInstance';
import { useMutation } from '@tanstack/react-query';

export interface ForgotPasswordResponse {
  message: string;
  expires_in_seconds: number;
  code?: string | null;
  masked_destination?: string | null;
}

export function useForgotPasswordRequest() {
  return useMutation({
    mutationFn: async (identifier: string) => {
      const { data } = await axiosInstance.post<ForgotPasswordResponse>(
        '/forgot-password',
        { identifier },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
  });
}

export function useForgotPasswordConfirm() {
  return useMutation({
    mutationFn: async (payload: {
      identifier: string;
      code: string;
      new_password: string;
      confirm_password: string;
    }) => {
      const { data } = await axiosInstance.post<{ message: string }>(
        '/forgot-password/confirm',
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
  });
}
