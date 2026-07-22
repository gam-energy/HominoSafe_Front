import type { ProfileData } from '@/features/medical-profile/types/medicalprofile';

export type ParsedDemographics = {
  age?: number | string;
  weight?: number | string;
  height?: number | string;
  gender?: string;
  raw?: string;
};

/** Turn EHR demographics (plain text or JSON) into structured fields for display. */
export function parseDemographics(
  demographics: string | null | undefined
): ParsedDemographics | null {
  if (!demographics || !String(demographics).trim()) return null;
  const text = String(demographics).trim();
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          age: parsed.age as number | string | undefined,
          weight: parsed.weight as number | string | undefined,
          height: parsed.height as number | string | undefined,
          gender:
            parsed.gender != null ? String(parsed.gender) : undefined,
        };
      }
    } catch {
      return { raw: text };
    }
  }
  return { raw: text };
}

export function normalizeComorbidities(
  comorbidities: ProfileData['comorbidities'] | null | undefined
): [string, string][] {
  if (!comorbidities) return [];

  // Simple string lists from import form → show name only (no fake "0" keys).
  if (Array.isArray(comorbidities)) {
    return comorbidities
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => [item, ''] as [string, string]);
  }

  return Object.entries(comorbidities).map(([key, value]) => {
    if (value === null || value === undefined) return [key, ''];
    if (typeof value === 'object') return [key, JSON.stringify(value)];
    const text = String(value).trim();
    // {"asthma": true} / {"asthma": "yes"} → label only
    if (
      text === '' ||
      text.toLowerCase() === 'true' ||
      text.toLowerCase() === 'yes' ||
      text === key
    ) {
      return [key, ''];
    }
    return [key, text];
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
