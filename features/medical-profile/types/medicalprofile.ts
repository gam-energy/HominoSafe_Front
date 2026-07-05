export type Medication = {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes?: string;
};

export type Symptom = {
  id: number;
  name: string;
  severity: string;
  onset_date: string;
  notes?: string;
};

export type ProfileData = {
  ehr_id: number;
  demographics: string;
  comorbidities: Record<string, string | unknown> | string[];
  diagnosis: string;
  physician_notes: string;
  timestamp: string;
  medications: Medication[];
  symptoms: Symptom[];
};
