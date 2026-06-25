import { AlertType } from "./AlertSchema";

export const sampleAlerts: AlertType[] = [
  {
    alertId: "alert-fall-001",
    userId: "user-maria-001",
    alertType: "FALL_DETECTED",
    severity: "critical",
    timestamp: "2026-06-25T03:15:00Z",
    sensorData: {
      bp: { systolic: 110, diastolic: 65 },
      heartRate: 104,
      spo2: 95,
      temperature: 36.8,
      activity: "Walking in hallway",
      fallDetected: true,
    },
    aiModelOutput: {
      explanation: "Accelerometry data indicated an abrupt vertical velocity signature combined with a sudden cessation of active posture signals, indicating a fall.",
      shapValues: {
        vertical_acceleration_g: 0.85,
        posture_angle_change: 0.62,
        pre_fall_gait_instability: 0.35,
        heart_rate_surge: 0.18,
      },
    },
    isAcknowledged: false,
    notes: "Patient detected falling in hallway. Emergency alarm triggered. Contacting first responders.",
  },
  {
    alertId: "alert-ortho-001",
    userId: "user-maria-001",
    alertType: "PREDICTED_ORTHOSTATIC_HYPOTENSION",
    severity: "medium",
    timestamp: "2026-06-24T07:12:30Z",
    predictedAt: "2026-06-24T07:15:00Z",
    sensorData: {
      bp: { systolic: 118, diastolic: 72 },
      heartRate: 58,
      spo2: 96,
      temperature: 36.5,
      activity: "Postural transition (Supine → Standing)",
      fallDetected: false,
    },
    aiModelOutput: {
      explanation:
        "Predicted systolic blood pressure decline following postural change with insufficient heart rate compensation.",
      shapValues: {
        beta_blocker_effect: -0.42,
        diabetic_autonomic_impairment: -0.31,
        hfpEF_preload_sensitivity: -0.18,
        posture_change: 0.22,
      },
    },
    isAcknowledged: true,
    acknowledgedBy: "Dr. Alireza Abbasi",
    acknowledgedAt: "2026-06-24T07:20:00Z",
    notes:
      "Moderate risk identified. No symptoms, arrhythmia, hypoxia, or fall detected. Monitoring trajectory.",
  },
  {
    alertId: "alert-hr-001",
    userId: "user-maria-001",
    alertType: "HR_SPIKE",
    severity: "high",
    timestamp: "2026-06-24T18:45:00Z",
    sensorData: {
      bp: { systolic: 135, diastolic: 82 },
      heartRate: 115,
      spo2: 94,
      temperature: 37.1,
      activity: "Sitting in living room",
      fallDetected: false,
    },
    aiModelOutput: {
      explanation: "Heart rate exceeded 110 bpm while user was inactive for over 15 minutes, showing a highly anomalous spike compared to historic resting baseline (72 bpm).",
      shapValues: {
        resting_baseline_excess: 0.58,
        sedentary_duration: 0.32,
        temperature_elevation: 0.15,
      },
    },
    isAcknowledged: false,
    notes: "Resting tachycardia detected. Advised patient to rest, drink water, and take deep breaths. Preparing medical call if unresolved.",
  },
  {
    alertId: "alert-oxygen-001",
    userId: "user-maria-001",
    alertType: "OXYGEN_LOW",
    severity: "high",
    timestamp: "2026-06-23T22:30:00Z",
    sensorData: {
      bp: { systolic: 125, diastolic: 78 },
      heartRate: 85,
      spo2: 90,
      temperature: 36.4,
      activity: "Sleeping (Bed)",
      fallDetected: false,
    },
    aiModelOutput: {
      explanation: "Oxygen saturation level (SpO2) fell to 90% during sleep, which marks a significant hypoxic dip from patient normal sleeping mean of 96%.",
      shapValues: {
        sleep_apnea_probability: 0.65,
        pulmonary_resistance: 0.25,
        oxygen_flow_constriction: 0.20,
      },
    },
    isAcknowledged: true,
    acknowledgedBy: "Dr. Alireza Abbasi",
    acknowledgedAt: "2026-06-23T23:10:00Z",
    notes: "SpO2 dipped to 90%. Airway adjustment performed by caregiver. Patient returned to 96% SpO2 shortly after.",
  },
  {
    alertId: "alert-temp-001",
    userId: "user-maria-001",
    alertType: "TEMP_HIGH",
    severity: "low",
    timestamp: "2026-06-22T14:10:00Z",
    sensorData: {
      bp: { systolic: 120, diastolic: 80 },
      heartRate: 78,
      spo2: 98,
      temperature: 38.2,
      activity: "Resting",
      fallDetected: false,
    },
    aiModelOutput: {
      explanation: "Body temperature rose above 38.0 °C indicating low-grade fever.",
      shapValues: {
        baseline_deviation: 0.45,
        infection_response_marker: 0.30,
      },
    },
    isAcknowledged: true,
    acknowledgedBy: "Caregiver (Fatemeh)",
    acknowledgedAt: "2026-06-22T14:30:00Z",
    notes: "Fever confirmed. Provided paracetamol. Advised increased fluid intake. Fever subsided after 2 hours.",
  }
];
