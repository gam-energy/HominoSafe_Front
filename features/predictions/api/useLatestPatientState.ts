import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { LatestPatientStateResponse } from '../types/predictions';

const fetchLatestPatientState = async (
  userId: number
): Promise<LatestPatientStateResponse | null> => {
  try {
    const response = await axiosInstance.get<LatestPatientStateResponse>(
      `/api/predictions/state/${userId}/latest`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const useLatestPatientState = (
  userId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery<LatestPatientStateResponse | null, AxiosError>({
    queryKey: ['patient-state', userId],
    queryFn: () => fetchLatestPatientState(userId),
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 60_000,
  });
};
