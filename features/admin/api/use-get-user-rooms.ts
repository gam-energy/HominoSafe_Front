import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminUserRoomsResponse } from '../types/admin';

const fetchUserRooms = async (userId: number | string) => {
  const { data } = await axiosInstance.get<AdminUserRoomsResponse>(
    `/admin/users/${userId}/rooms`,
  );
  return data;
};

export function useGetUserRooms(userId: number | string | undefined) {
  return useQuery({
    queryKey: ['admin-user-rooms', userId],
    queryFn: () => fetchUserRooms(userId as number | string),
    enabled: userId != null && userId !== '',
  });
}
