import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import type { IngestKnowledgePayload } from "../types/knowledge";

const ingestKnowledge = async (payload: IngestKnowledgePayload) => {
  const formData = new FormData();
  formData.append("user_id", String(payload.userId));
  formData.append("profile_json", JSON.stringify(payload.profileJson));
  payload.documentTypes.forEach((type) => {
    formData.append("document_types", type);
  });
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post(
    "/api/ingest/patient-knowledge",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const useIngestKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AxiosError, IngestKnowledgePayload>({
    mutationFn: ingestKnowledge,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-knowledge-status", variables.userId],
      });
    },
  });
};
