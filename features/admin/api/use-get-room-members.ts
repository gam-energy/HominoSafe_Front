import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import type { AdminRoomMembersResponse } from '../types/admin';

const fetchRoomMembers = async (roomId: string) => {
  const { data } = await axiosInstance.get<AdminRoomMembersResponse>(
    `/admin/rooms/${encodeURIComponent(roomId)}/members`,
  );
  return data;
};

export function useGetRoomMembers(roomId: string | undefined, enabled = false) {
  return useQuery({
    queryKey: ['admin-room-members', roomId],
    queryFn: () => fetchRoomMembers(roomId as string),
    enabled: !!roomId && enabled,
  });
}
