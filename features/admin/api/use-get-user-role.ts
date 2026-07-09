import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminUserRoleLookup } from '../types/admin';

const fetchUserRole = async (username: string) => {
  const { data } = await axiosInstance.get<AdminUserRoleLookup>(
    `/admin/user-role/${encodeURIComponent(username)}`,
  );
  return data;
};

export function useGetUserRole(username: string | undefined) {
  return useQuery({
    queryKey: ['admin-user-role', username],
    queryFn: () => fetchUserRole(username as string),
    enabled: !!username && username.length > 0,
  });
}
