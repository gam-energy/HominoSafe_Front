import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminRoomsResponse } from '../types/admin';

export interface AdminRoomsQuery {
  limit?: number;
  from_token?: string;
  search_term?: string;
}

const fetchRooms = async (query: AdminRoomsQuery = {}) => {
  const params: Record<string, unknown> = { limit: query.limit ?? 100 };
  if (query.from_token) params.from_token = query.from_token;
  if (query.search_term) params.search_term = query.search_term;

  const { data } = await axiosInstance.get<AdminRoomsResponse>('/admin/rooms', {
    params,
  });
  return data;
};

export function useGetRooms(query: AdminRoomsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: [
      'admin-rooms',
      query.limit ?? 100,
      query.from_token ?? '',
      query.search_term ?? '',
    ],
    queryFn: () => fetchRooms(query),
    enabled,
  });
}
