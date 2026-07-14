import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import axiosInstance from '@/api/axiosInstance';

export type EnsureCareTeamRoomsResponse = {
  created: Array<{ username: string; mxid: string; room_id: string; display_name?: string }>;
  reused: Array<{ username: string; mxid: string; room_id: string; display_name?: string }>;
  errors: Array<{ username: string; error?: string }>;
  accepted_invites: string[];
  peer_count: number;
};

export const useEnsureCareTeamRooms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const matrixToken = Cookies.get('synapse_access_token');
      if (!matrixToken) {
        throw new Error('No Matrix access token found');
      }
      const { data } = await axiosInstance.post<EnsureCareTeamRoomsResponse>(
        '/synapse/rooms/ensure-care-team',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Synapse-Authorization': `Bearer ${matrixToken}`,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};
