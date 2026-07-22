import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import { patientImportRecordsQueryKey } from "./usePatientKnowledge";

type DeleteDocumentVars = {
  userId: number;
  documentId: number;
};

const deleteDocument = async ({ userId, documentId }: DeleteDocumentVars) => {
  await axiosInstance.delete(
    `/api/ingest/patient-knowledge/${userId}/documents/${documentId}`
  );
};

export const useDeletePatientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, DeleteDocumentVars>({
    mutationFn: deleteDocument,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-knowledge-status", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: patientImportRecordsQueryKey(variables.userId),
      });
    },
  });
};
