import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { CnnPredictionOverview } from '../types/cnn';

const fetchCnnPredictions = async (
  userId: number
): Promise<CnnPredictionOverview> => {
  const response = await axiosInstance.get<CnnPredictionOverview>(
    `/api/predictions/cnn/${userId}`,
    { params: { history_limit: 24 } }
  );
  return response.data;
};

export const useCnnPredictions = (userId: number) => {
  return useQuery<CnnPredictionOverview, AxiosError>({
    queryKey: ['cnn-predictions', userId],
    queryFn: () => fetchCnnPredictions(userId),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
};
