import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import axiosInstance from "@/api/axiosInstance";
import type { CdsAnalyzeRequest, CdsReport } from "../types/cds";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const analyzePatient = async (
  patientId: number,
  body: CdsAnalyzeRequest = {}
): Promise<CdsReport> => {
  const payload = {
    force_refresh: body.force_refresh ?? false,
    include_history_hours: body.include_history_hours ?? 72,
  };

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axiosInstance.post<CdsReport>(
        `/api/v1/cds/analyze/${patientId}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 120_000,
        }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 503 &&
        attempt < maxRetries
      ) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Analysis failed after retries");
};

export const useCdsAnalyze = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CdsReport,
    AxiosError,
    { patientId: number; body?: CdsAnalyzeRequest }
  >({
    mutationFn: ({ patientId, body }) => analyzePatient(patientId, body),
    onSuccess: (_data, variables) => {
      const id = variables.patientId;
      void queryClient.invalidateQueries({ queryKey: ["cds-report", id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-overview", id] });
      void queryClient.invalidateQueries({ queryKey: ["history", id] });
      void queryClient.invalidateQueries({ queryKey: ["patient-state", id] });
      void queryClient.invalidateQueries({ queryKey: ["cnn-predictions", id] });
      void queryClient.invalidateQueries({ queryKey: ["active-alerts-kpi"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical-reports", id] });
    },
  });
};
