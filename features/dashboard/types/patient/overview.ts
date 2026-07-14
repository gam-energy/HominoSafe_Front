// types/dashboard.ts
export interface DashboardData {
  wearable?: {
    timestamp?: string;
    heart_rate?: number | null;
    bp_systolic?: number | null;
    bp_diastolic?: number | null;
    spo2?: number | null;
    activity?: string | null;
    temperature?: number | null;
  } | null;
  environmental?: {
    timestamp?: string;
    temperature?: number | null;
    humidity?: number | null;
    /** Legacy frontend field name */
    MQ25?: number | null;
    /** Backend schema field */
    mq2?: number | null;
    CO2?: number | null;
  } | null;
  metadata?: {
    user_id: number;
    last_updated: string;
  };
}
