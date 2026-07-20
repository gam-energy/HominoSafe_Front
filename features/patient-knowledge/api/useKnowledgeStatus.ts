import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import type { KnowledgeStatusResponse } from "../types/knowledge";

const fetchKnowledgeStatus = async (
  userId: number
): Promise<KnowledgeStatusResponse> => {
  const response = await axiosInstance.get<KnowledgeStatusResponse>(
    `/api/ingest/patient-knowledge/${userId}/status`
  );
  return response.data;
};

export const useKnowledgeStatus = (
  userId?: number,
  options?: { enabled?: boolean; poll?: boolean }
) => {
  return useQuery({
    queryKey: ["patient-knowledge-status", userId],
    queryFn: () => fetchKnowledgeStatus(userId as number),
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 0,
    refetchInterval: (query) => {
      if (!options?.poll) return false;
      const status = query.state.data?.refresh_status;
      if (status === "ready" || status === "failed") return false;
      return 2500;
    },
  });
};
