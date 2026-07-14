export type CdsOverallStatus =
  | "stable"
  | "attention"
  | "critical"
  | "unknown"
  | string;

export type FindingSeverity = "low" | "moderate" | "high" | "critical" | string;

export interface CdsFinding {
  id?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category?: string;
  evidence?: string[];
}

export interface CdsRecommendation {
  id?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | string;
  severity?: string;
  action?: string;
}

export interface SpecialistOutput {
  specialist: string;
  summary: string;
  evidence?: string[];
}

export interface DecisionGraphNode {
  id: string;
  label: string;
  description?: string;
  status?: string;
  order: number;
}

export interface DecisionGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DecisionGraphPayload {
  nodes: DecisionGraphNode[];
  edges: DecisionGraphEdge[];
}

export interface CausalGraphNode {
  id: string;
  label: string;
  kind: string;
}

export interface CausalGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  confidence: number;
  evidence_level?: string;
  condition?: string;
}

export interface CausalGraphPayload {
  nodes: CausalGraphNode[];
  edges: CausalGraphEdge[];
}

export interface CdsReport {
  patient_id: number;
  overall_status: CdsOverallStatus;
  analyzed_at?: string;
  critical_findings: CdsFinding[];
  recommendations: CdsRecommendation[];
  specialist_outputs?: SpecialistOutput[];
  reasoning_trace?: string;
  decision_graph?: DecisionGraphPayload;
  causal_graph?: CausalGraphPayload;
}

export interface CdsAnalyzeRequest {
  force_refresh?: boolean;
  include_history_hours?: number;
}

export interface CdsFeedbackRequest {
  feedback: string;
}
