import type { AxiosError } from "axios";

export type PatientKnowledgeErrorKind =
  | "forbidden"
  | "not_found"
  | "validation"
  | "generic";

export function parsePatientKnowledgeError(error: unknown): {
  kind: PatientKnowledgeErrorKind;
  message: string;
} {
  const axiosError = error as AxiosError<{ detail?: string | { msg?: string }[] }>;
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail;

  let message =
    (typeof detail === "string" ? detail : axiosError.message) ||
    "Something went wrong";

  if (Array.isArray(detail)) {
    message = detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ");
  }

  if (status === 403) {
    return {
      kind: "forbidden",
      message: "You don't have access to this patient.",
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      message:
        typeof detail === "string"
          ? detail
          : "Target patient not found. Return to the patient list and try again.",
    };
  }

  if (status === 422) {
    return { kind: "validation", message };
  }

  return { kind: "generic", message };
}
