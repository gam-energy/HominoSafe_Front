export interface CnnWindowRisk {
  id: number;
  user_id: number;
  device_id?: string | null;
  timestamp: string;
  af_probability?: number | null;
  sbp_mmhg?: number | null;
  dbp_mmhg?: number | null;
  rmssd_ms?: number | null;
  sdnn_ms?: number | null;
  apnea_probability?: number | null;
  af_risk_score?: number | null;
  bp_risk_score?: number | null;
  hrv_risk_score?: number | null;
  apnea_risk_score?: number | null;
  cardiac_risk_score?: number | null;
  cardiac_level?: string | null;
  summary?: string | null;
}

export interface CnnStrokeRisk {
  id: number;
  user_id: number;
  device_id?: string | null;
  timestamp: string;
  af_burden?: number | null;
  af_windows?: number | null;
  total_windows?: number | null;
  cha2ds2_vasc_score?: number | null;
  stroke_risk_score?: number | null;
  stroke_level?: string | null;
  summary?: string | null;
}

export interface CnnPredictionOverview {
  user_id: number;
  model_name: string;
  model_version: string;
  description: string;
  latest_window?: CnnWindowRisk | null;
  recent_windows: CnnWindowRisk[];
  latest_stroke?: CnnStrokeRisk | null;
  watch_connected: boolean;
  last_watch_sample_at?: string | null;
}
