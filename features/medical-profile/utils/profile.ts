import type { ProfileData } from '@/features/medical-profile/types/medicalprofile';

export function normalizeComorbidities(
  comorbidities: ProfileData['comorbidities'] | null | undefined
): [string, string][] {
  if (!comorbidities) return [];

  if (Array.isArray(comorbidities)) {
    return comorbidities.map((item, index) => [String(index), String(item)]);
  }

  return Object.entries(comorbidities).map(([key, value]) => {
    if (value === null || value === undefined) return [key, ''];
    if (typeof value === 'object') return [key, JSON.stringify(value)];
    return [key, String(value)];
  });
}

export function emptyProfile(): ProfileData {
  return {
    ehr_id: 0,
    demographics: '',
    comorbidities: {},
    diagnosis: '',
    physician_notes: '',
    timestamp: '',
    medications: [],
    symptoms: [],
  };
}
