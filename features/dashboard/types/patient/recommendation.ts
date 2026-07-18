// types/recommendation.ts
export interface MetricRecommendation {
  value: number;
  status: 'normal' | 'warning' | 'critical';
  reference_range: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RecommendData {
  timestamp: string;
  user_id: number;
  health_metrics: {
    [metric: string]: MetricRecommendation;
  };
  environment_metrics: {
    [metric: string]: MetricRecommendation;
  };
  general_recommendations: string[];
  alert_level_value: number;
}
