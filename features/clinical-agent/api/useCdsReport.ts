import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import axiosInstance from "@/api/axiosInstance";
import type {
  CausalGraphPayload,
  CdsFinding,
  CdsRecommendation,
  CdsReport,
  DecisionGraphPayload,
} from "../types/cds";

type CdsApiEnvelope = {
  report?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} & Partial<CdsReport>;

function asFinding(item: unknown, index: number): CdsFinding {
  if (typeof item === "string") {
    return {
      id: `finding-${index}`,
      title: item,
      description: item,
      severity: "high",
    };
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const title =
      (typeof obj.title === "string" && obj.title) ||
      (typeof obj.finding === "string" && obj.finding) ||
      (typeof obj.message === "string" && obj.message) ||
      `Finding ${index + 1}`;
    const description =
      (typeof obj.description === "string" && obj.description) ||
      (typeof obj.summary === "string" && obj.summary) ||
      title;
    return {
      id: typeof obj.id === "string" ? obj.id : `finding-${index}`,
      title,
      description,
      severity: (typeof obj.severity === "string" && obj.severity) || "moderate",
      category: typeof obj.category === "string" ? obj.category : undefined,
      evidence: Array.isArray(obj.evidence)
        ? obj.evidence.map(String)
        : undefined,
    };
  }
  return {
    id: `finding-${index}`,
    title: String(item),
    description: String(item),
    severity: "moderate",
  };
}

function asRecommendation(item: unknown, index: number): CdsRecommendation {
  if (typeof item === "string") {
    return {
      id: `rec-${index}`,
      title: item,
      description: item,
      priority: "medium",
    };
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const title =
      (typeof obj.title === "string" && obj.title) ||
      (typeof obj.action === "string" && obj.action) ||
      `Recommendation ${index + 1}`;
    const description =
      (typeof obj.description === "string" && obj.description) ||
      (typeof obj.summary === "string" && obj.summary) ||
      title;
    return {
      id: typeof obj.id === "string" ? obj.id : `rec-${index}`,
      title,
      description,
      priority: (typeof obj.priority === "string" && obj.priority) || "medium",
      severity: typeof obj.severity === "string" ? obj.severity : undefined,
      action: typeof obj.action === "string" ? obj.action : undefined,
    };
  }
  return {
    id: `rec-${index}`,
    title: String(item),
    description: String(item),
    priority: "medium",
  };
}

function normalizeCdsReport(payload: CdsApiEnvelope, patientId: number): CdsReport {
  const raw = (payload.report ?? payload) as Record<string, unknown>;
  const findings = Array.isArray(raw.critical_findings)
    ? raw.critical_findings.map(asFinding)
    : [];

  const recRaw = raw.recommendations;
  let recommendations: CdsRecommendation[] = [];
  if (Array.isArray(recRaw)) {
    recommendations = recRaw.map(asRecommendation);
  } else if (recRaw && typeof recRaw === "object") {
    const obj = recRaw as Record<string, unknown>;
    const nested = [
      ...(Array.isArray(obj.clinical_actions) ? obj.clinical_actions : []),
      ...(Array.isArray(obj.lifestyle_modifications)
        ? obj.lifestyle_modifications
        : []),
      ...(Array.isArray(obj.immediate) ? obj.immediate : []),
      ...(Array.isArray(obj.short_term) ? obj.short_term : []),
      ...(Array.isArray(obj.long_term) ? obj.long_term : []),
      ...(Array.isArray(obj.items) ? obj.items : []),
    ];
    if (typeof obj.monitoring_frequency === "string" && obj.monitoring_frequency) {
      nested.push(`Monitoring: ${obj.monitoring_frequency}`);
    }
    if (obj.medication_review_needed === true) {
      nested.push("Medication review needed");
    }
    recommendations = nested.map(asRecommendation);
  }

  const meta = (payload.metadata ?? {}) as Record<string, unknown>;
  const specialistRaw = raw.specialist_outputs ?? meta.specialist_outputs;
  const specialist_outputs = Array.isArray(specialistRaw)
    ? specialistRaw
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          specialist: String(item.specialist ?? "Specialist"),
          summary: String(item.summary ?? ""),
          evidence: Array.isArray(item.evidence)
            ? item.evidence.map(String)
            : undefined,
        }))
    : undefined;

  const generatedAt = meta.generated_at;
  const decision_graph = meta.decision_graph as DecisionGraphPayload | undefined;
  const causal_graph = meta.causal_graph as CausalGraphPayload | undefined;

  return {
    patient_id:
      typeof raw.patient_id === "number"
        ? raw.patient_id
        : typeof meta.patient_id === "number"
          ? (meta.patient_id as number)
          : patientId,
    overall_status: String(
      raw.overall_status ?? raw.status_summary ?? "unknown"
    ),
    analyzed_at:
      typeof raw.analyzed_at === "string"
        ? raw.analyzed_at
        : typeof generatedAt === "string"
          ? generatedAt
          : undefined,
    critical_findings: findings,
    recommendations,
    specialist_outputs,
    reasoning_trace:
      (typeof raw.reasoning_trace === "string" && raw.reasoning_trace) ||
      (typeof raw.reasoning === "string" && raw.reasoning) ||
      undefined,
    decision_graph,
    causal_graph,
  };
}

const fetchCdsReport = async (patientId: number): Promise<CdsReport | null> => {
  try {
    const response = await axiosInstance.get<CdsApiEnvelope>(
      `/api/v1/cds/report/${patientId}`
    );
    return normalizeCdsReport(response.data, patientId);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const useCdsReport = (patientId?: number, enabled = true) => {
  return useQuery<CdsReport | null, AxiosError>({
    queryKey: ["cds-report", patientId],
    queryFn: () => fetchCdsReport(patientId as number),
    enabled: !!patientId && enabled,
    staleTime: 1000 * 60,
  });
};
