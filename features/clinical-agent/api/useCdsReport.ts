import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import axiosInstance from "@/api/axiosInstance";
import type { CdsReport } from "../types/cds";

const fetchCdsReport = async (patientId: number): Promise<CdsReport | null> => {
  try {
    const response = await axiosInstance.get<CdsReport>(
      `/api/v1/cds/report/${patientId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const useCdsReport = (patientId: number, enabled = true) => {
  return useQuery<CdsReport | null, AxiosError>({
    queryKey: ["cds-report", patientId],
    queryFn: () => fetchCdsReport(patientId),
    enabled: !!patientId && enabled,
    staleTime: 1000 * 60,
  });
};
