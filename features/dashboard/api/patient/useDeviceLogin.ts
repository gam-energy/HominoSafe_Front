import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { DevicePairResponse } from '@/features/profile/types/profile';

const pairDevice = async (): Promise<DevicePairResponse> => {
  const response = await axiosInstance.post<DevicePairResponse>(
    '/device/pair',
    {},
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const useDevicePair = () => {
  return useMutation<DevicePairResponse, AxiosError, void>({
    mutationFn: pairDevice,
  });
};
