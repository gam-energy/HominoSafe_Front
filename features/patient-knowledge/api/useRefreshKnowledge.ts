import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import { patientImportRecordsQueryKey } from "./usePatientKnowledge";

const refreshKnowledge = async (userId: number) => {
  const response = await axiosInstance.post(
    `/api/ingest/patient-knowledge/${userId}/refresh`
  );
  return response.data;
};

export const useRefreshKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AxiosError, number>({
    mutationFn: refreshKnowledge,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-knowledge-status", userId],
      });
      queryClient.invalidateQueries({
        queryKey: patientImportRecordsQueryKey(userId),
      });
    },
  });
};
