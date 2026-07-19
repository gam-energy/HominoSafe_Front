export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes: string;
}

export interface Symptom {
  id: number;
  name: string;
  severity: string;
  onset_date: string;
  notes: string;
}

export interface UserProfile {
  last_name: string;
  first_name: string;
  user_name: string;
  ehr_id: number;
  demographics: string;
  comorbidities: {
    diabetes?: string;
    hypertension?: string;
    [key: string]: string | undefined;
  };
  allergies?: string[] | null;
  diagnosis: string;
  physician_notes: string;
  timestamp: string;
  medications: Medication[];
  symptoms: Symptom[];
}
