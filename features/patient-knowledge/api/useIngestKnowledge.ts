import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import type {
  IngestKnowledgePayload,
  IngestKnowledgeResponse,
} from "../types/knowledge";
import { patientImportRecordsQueryKey } from "./usePatientKnowledge";

const ingestKnowledge = async (
  payload: IngestKnowledgePayload
): Promise<IngestKnowledgeResponse> => {
  const formData = new FormData();
  formData.append("user_id", String(payload.userId));
  formData.append("profile_json", JSON.stringify(payload.profileJson));

  if (payload.documentTypes.length > 0) {
    formData.append("document_types", JSON.stringify(payload.documentTypes));
  }

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  // Do NOT set Content-Type manually — axios must attach the multipart boundary.
  const response = await axiosInstance.post<IngestKnowledgeResponse>(
    "/api/ingest/patient-knowledge",
    formData
  );

  return response.data;
};

export const useIngestKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation<IngestKnowledgeResponse, AxiosError, IngestKnowledgePayload>({
    mutationFn: ingestKnowledge,
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
