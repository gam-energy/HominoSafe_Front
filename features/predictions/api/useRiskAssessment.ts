import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type {
  RiskAssessmentRequest,
  RiskAssessmentResponse,
} from '../types/predictions';

const runRiskAssessment = async (
  userId: number,
  body: RiskAssessmentRequest = {}
): Promise<RiskAssessmentResponse> => {
  const response = await axiosInstance.post<RiskAssessmentResponse>(
    `/api/predictions/risk-assessment/${userId}`,
    { force_refresh: body.force_refresh ?? false },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120_000,
    }
  );
  return response.data;
};

export const useRiskAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RiskAssessmentResponse,
    AxiosError,
    { userId: number; body?: RiskAssessmentRequest }
  >({
    mutationFn: ({ userId, body }) => runRiskAssessment(userId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['patient-state', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-summary', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recommendation', variables.userId],
      });
    },
  });
};
