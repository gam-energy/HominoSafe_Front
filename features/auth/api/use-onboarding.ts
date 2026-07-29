import axiosInstance from '@/api/axiosInstance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type OnboardingStatus = {
  role: string;
  email_verified: boolean;
  nest_activated: boolean;
  panel_unlocked: boolean;
  has_nest_order: boolean;
  masked_email?: string | null;
};

export function useOnboardingStatus(enabled = true) {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<OnboardingStatus>(
        '/onboarding-status',
      );
      return data;
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useActivateNest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await axiosInstance.post<{
        message: string;
        nest_activated: boolean;
      }>(
        '/activate-nest',
        { code },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
}
