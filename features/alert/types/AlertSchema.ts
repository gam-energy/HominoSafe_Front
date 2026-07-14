export interface BPData {
  systolic?: number;
  diastolic?: number;
}

export interface SensorData {
  bp?: BPData;
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  activity?: string;
  fallDetected?: boolean;
}

export interface AIModelOutput {
  explanation?: string;
  shapValues?: Record<string, number>;
}

export interface VisionInfo {
  visionDataId?: number;
  source?: string;
  confidence?: number;
  frameUrl?: string;
  hasInlineFrame?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface AlertType {
  alertId: string;
  userId: string;
  alertType:
    | 'BP_DROP'
    | 'HR_SPIKE'
    | 'FALL_DETECTED'
    | 'OXYGEN_LOW'
    | 'TEMP_HIGH'
    | 'CARDIAC_RISK'
    | 'STROKE_RISK'
    | 'ENVIRONMENT'
    | 'OTHER'
    | 'MEDICATION_REMINDER'
    | 'PREDICTED_ORTHOSTATIC_HYPOTENSION';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  predictedAt?: string;
  sensorData?: SensorData;
  aiModelOutput?: AIModelOutput;
  isAcknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
  // Live-pipeline enrichments
  status?: string;
  source?: string;
  patientName?: string;
  vision?: VisionInfo;
  message?: string;
}

/** Raw alert row as returned by the backend REST/WebSocket API. */
export interface BackendAlert {
  id: number;
  user_id: number;
  alert_type?: string | null;
  message?: string | null;
  severity: string;
  status?: string;
  source?: string | null;
  recipient?: string | null;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  notes?: string | null;
  timestamp?: string | null;
  vitals?: {
    heart_rate?: number | null;
    bp_systolic?: number | null;
    bp_diastolic?: number | null;
    spo2?: number | null;
    temperature?: number | null;
    activity?: string | null;
  } | null;
}

/** Rich payload attached to a SYSTEM_ALERT WebSocket notification. */
export interface BackendAlertPayload {
  alert_id: number;
  patient_id: number;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  alert_type?: string | null;
  severity?: string;
  status?: string;
  source?: string | null;
  message?: string | null;
  timestamp?: string | null;
  vitals?: {
    heart_rate?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    spo2?: number;
    temperature?: number;
  };
  vision?: {
    vision_data_id?: number;
    source?: string;
    confidence?: number;
    frame_url?: string;
    has_inline_frame?: boolean;
    metadata?: Record<string, unknown> | null;
  };
}
