import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminUserListItem } from '../types/admin';

export interface AdminUsersQuery {
  skip?: number;
  limit?: number;
  status?: 'active' | 'inactive';
}

const fetchAdminUsers = async (query: AdminUsersQuery = {}) => {
  const params: Record<string, unknown> = {
    skip: query.skip ?? 0,
    limit: query.limit ?? 100,
  };
  if (query.status) params.status = query.status;

  const { data } = await axiosInstance.get<AdminUserListItem[]>('/admin/users', {
    params,
  });
  return data;
};

export function useGetAdminUsers(query: AdminUsersQuery = {}) {
  return useQuery({
    queryKey: ['admin-users', query.skip ?? 0, query.limit ?? 100, query.status ?? 'all'],
    queryFn: () => fetchAdminUsers(query),
  });
}
