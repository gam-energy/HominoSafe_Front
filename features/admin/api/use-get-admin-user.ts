import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminUserDetail } from '../types/admin';

const fetchAdminUser = async (userId: number | string) => {
  const { data } = await axiosInstance.get<AdminUserDetail>(
    `/admin/users/${userId}`,
  );
  return data;
};

export function useGetAdminUser(userId: number | string | undefined) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => fetchAdminUser(userId as number | string),
    enabled: userId != null && userId !== '',
  });
}
