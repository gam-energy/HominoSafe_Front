import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { DevicePairResponse } from '@/features/profile/types/profile';

export type PairedDevice = {
  id: number;
  device_id: string;
  mqtt_username?: string | null;
  created_at: string;
  last_seen_at: string | null;
  online: boolean;
  activity?: string | null;
  body_position?: string | null;
  activity_intensity?: number;
};

export type DeviceListResponse = {
  devices: PairedDevice[];
};

export const MY_DEVICES_QUERY_KEY = ['my-devices'] as const;

const pairDevice = async (): Promise<DevicePairResponse> => {
  const response = await axiosInstance.post<DevicePairResponse>(
    '/device/pair',
    {},
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

const fetchMyDevices = async (): Promise<DeviceListResponse> => {
  const response = await axiosInstance.get<DeviceListResponse>('/device', {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const revokeDevice = async (payload: {
  device_id?: string;
  credential_id?: number;
}): Promise<{ revoked: number }> => {
  const response = await axiosInstance.post<{ revoked: number }>(
    '/device/revoke',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const useDevicePair = () => {
  return useMutation<DevicePairResponse, AxiosError, void>({
    mutationFn: pairDevice,
  });
};

export const useMyDevices = (enabled = true) => {
  return useQuery({
    queryKey: MY_DEVICES_QUERY_KEY,
    queryFn: fetchMyDevices,
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
};

export const useDeviceRevoke = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { revoked: number },
    AxiosError,
    { device_id?: string; credential_id?: number }
  >({
    mutationFn: revokeDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_DEVICES_QUERY_KEY });
    },
  });
};
