import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import type { PatientKnowledgeResponse } from "../types/knowledge";
import { normalizePatientKnowledgeResponse } from "../utils/profileMappers";

export const patientImportRecordsQueryKey = (patientId: number) =>
  ["patient-import-records", patientId] as const;

/** @deprecated use patientImportRecordsQueryKey */
export const patientKnowledgeQueryKey = patientImportRecordsQueryKey;

const fetchPatientImportRecords = async (
  patientId: number
): Promise<PatientKnowledgeResponse> => {
  const response = await axiosInstance.get<PatientKnowledgeResponse>(
    `/api/ingest/patient-knowledge/${patientId}`
  );
  return normalizePatientKnowledgeResponse(response.data);
};

export const usePatientImportRecords = (
  patientId: number,
  options?: { enabled?: boolean; poll?: boolean }
) => {
  return useQuery({
    queryKey: patientImportRecordsQueryKey(patientId),
    queryFn: () => fetchPatientImportRecords(patientId),
    enabled: Number.isFinite(patientId) && patientId > 0 && (options?.enabled ?? true),
    staleTime: 0,
    refetchInterval: (query) => {
      if (!options?.poll) return false;
      const status = query.state.data?.knowledge?.refresh_status;
      if (status === "pending" || status === "processing") return 2000;
      return false;
    },
  });
};

/** @deprecated use usePatientImportRecords */
export const usePatientKnowledge = usePatientImportRecords;
