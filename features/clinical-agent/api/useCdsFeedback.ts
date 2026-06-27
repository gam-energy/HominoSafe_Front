import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { AxiosError } from "axios";
import type { CdsFeedbackRequest } from "../types/cds";

const submitFeedback = async (
  patientId: number,
  body: CdsFeedbackRequest
) => {
  const response = await axiosInstance.post(
    `/api/v1/cds/feedback/${patientId}`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

export const useCdsFeedback = () => {
  return useMutation<
    unknown,
    AxiosError,
    { patientId: number; feedback: string }
  >({
    mutationFn: ({ patientId, feedback }) =>
      submitFeedback(patientId, { feedback }),
  });
};
