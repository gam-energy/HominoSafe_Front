// features/dashboard/types/summery.ts

export type KPI = {
  value: number;
  trend: string | number | null;
  average_last_24h: number | null;
  average_last_7d: number | null;
  unit: string;
};

type RiskAssessment = {
  time: string;
  risk_level: string;
  predicted_condition: string;
  recommendation: string;
  risk_score?: number | null;
};

export type RecentAlert = {
  id?: string | number;
  message: string;
  alert_type?: string;
  severity?: string;
  time?: string;
};

export type SummaryData = {
  user_id: number;
  last_updated: string;
  kpis: Record<string, KPI>;
  recent_alerts: RecentAlert[];
  risk_assessments: RiskAssessment[];
  daily_overview?: {
    date: string;
    avg_heart_rate: number | null;
    avg_spo2: number | null;
    max_bp_systolic: number | null;
    min_bp_diastolic: number | null;
  };
  latest_activity?: string | null;
};

