import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminRelationsResponse } from '../types/admin';

export interface AdminRelationsQuery {
  skip?: number;
  limit?: number;
}

const fetchRelations = async (query: AdminRelationsQuery = {}) => {
  const { data } = await axiosInstance.get<AdminRelationsResponse>(
    '/admin/relations',
    {
      params: {
        skip: query.skip ?? 0,
        limit: query.limit ?? 100,
      },
    },
  );
  return data;
};

export function useGetRelations(query: AdminRelationsQuery = {}) {
  return useQuery({
    queryKey: ['admin-relations', query.skip ?? 0, query.limit ?? 100],
    queryFn: () => fetchRelations(query),
  });
}
