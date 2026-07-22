import type {
  PatientKnowledgeResponse,
  PatientProfileJson,
  ProfileDemographics,
} from "../types/knowledge";

export type ProfileFormSeed = {
  diagnosis: string;
  comorbidities: string;
  physician_notes: string;
  medical_history: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    start_date?: string;
    end_date?: string;
    notes?: string;
  }>;
  symptoms: Array<{
    name: string;
    severity: string;
    onset_date?: string;
    notes?: string;
  }>;
};

const EMPTY_FORM_SEED: ProfileFormSeed = {
  diagnosis: "",
  comorbidities: "",
  physician_notes: "",
  medical_history: "",
  age: "",
  weight: "",
  height: "",
  gender: "",
  medications: [],
  symptoms: [],
};

function normalizeComorbidities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry != null && String(entry).trim() !== "")
      .map(([key, entry]) => {
        const text = String(entry).trim();
        if (text.toLowerCase() === "yes" || text === key) return key;
        return `${key}: ${text}`;
      });
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseDemographics(
  demographics?: PatientProfileJson["demographics"],
  patientAge?: number
): ProfileDemographics {
  if (typeof demographics === "string") {
    try {
      const parsed = JSON.parse(demographics) as ProfileDemographics;
      if (parsed && typeof parsed === "object") {
        return { ...parsed, age: parsed.age ?? patientAge };
      }
    } catch {
      return patientAge != null ? { age: patientAge } : {};
    }
    return patientAge != null ? { age: patientAge } : {};
  }

  if (demographics && typeof demographics === "object") {
    return { ...demographics, age: demographics.age ?? patientAge };
  }

  return patientAge != null ? { age: patientAge } : {};
}

function formatMedicalHistory(
  medicalHistory?: PatientProfileJson["medical_history"]
): string {
  if (!medicalHistory) return "";
  if (typeof medicalHistory === "string") return medicalHistory;
  return medicalHistory
    .map((item) => {
      const parts = [item.name];
      if (item.level) parts.push(`(${item.level})`);
      if (item.duration_years != null) parts.push(`${item.duration_years}y`);
      if (item.duration_months != null) parts.push(`${item.duration_months}mo`);
      return parts.join(" ");
    })
    .join("\n");
}

export function normalizeProfile(
  profile: unknown,
  patientAge?: number
): PatientProfileJson | null {
  if (profile == null) return null;

  let raw = profile;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const comorbidities = normalizeComorbidities(record.comorbidities);
  const medications = Array.isArray(record.medications)
    ? record.medications
    : [];
  const symptoms = Array.isArray(record.symptoms) ? record.symptoms : [];

  const normalized: PatientProfileJson = {
    diagnosis: String(record.diagnosis ?? ""),
    comorbidities,
    demographics: parseDemographics(
      record.demographics as PatientProfileJson["demographics"],
      patientAge
    ),
    physician_notes: String(record.physician_notes ?? ""),
    medical_history: record.medical_history as PatientProfileJson["medical_history"],
    medications: medications.map((med) => {
      const item = med as Record<string, unknown>;
      return {
        name: String(item.name ?? ""),
        dosage: String(item.dosage ?? ""),
        frequency: String(item.frequency ?? ""),
        start_date: item.start_date ? String(item.start_date) : undefined,
        end_date: item.end_date ? String(item.end_date) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
      };
    }),
    symptoms: symptoms.map((sym) => {
      const item = sym as Record<string, unknown>;
      return {
        name: String(item.name ?? ""),
        severity: String(item.severity ?? ""),
        onset_date: item.onset_date ? String(item.onset_date) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
      };
    }),
  };

  return hasProfileContent(normalized) ? normalized : null;
}

export function hasProfileContent(profile: PatientProfileJson): boolean {
  return Boolean(
    profile.diagnosis?.trim() ||
      profile.physician_notes?.trim() ||
      profile.comorbidities?.length ||
      profile.medications?.length ||
      profile.symptoms?.length ||
      profile.medical_history ||
      profile.demographics
  );
}

export function normalizePatientKnowledgeResponse(
  data: PatientKnowledgeResponse
): PatientKnowledgeResponse {
  const profile = normalizeProfile(data.profile, data.patient?.age);
  return {
    ...data,
    profile,
    documents: Array.isArray(data.documents) ? data.documents : [],
    knowledge: data.knowledge ?? {
      user_id: data.patient?.user_id ?? 0,
      refresh_status: "idle",
    },
  };
}

export function profileToFormSeed(
  data: PatientKnowledgeResponse
): ProfileFormSeed {
  const normalized = normalizePatientKnowledgeResponse(data);
  const profile = normalized.profile;
  if (!profile) {
    const age =
      normalized.patient.age != null ? String(normalized.patient.age) : "";
    return age ? { ...EMPTY_FORM_SEED, age } : EMPTY_FORM_SEED;
  }

  const demographics = parseDemographics(
    profile.demographics,
    normalized.patient.age
  );

  return {
    diagnosis: profile.diagnosis ?? "",
    comorbidities: (profile.comorbidities ?? []).join(", "),
    physician_notes: profile.physician_notes ?? "",
    medical_history: formatMedicalHistory(profile.medical_history),
    age: demographics.age != null ? String(demographics.age) : "",
    weight: demographics.weight != null ? String(demographics.weight) : "",
    height: demographics.height != null ? String(demographics.height) : "",
    gender: demographics.gender ?? "",
    medications: (profile.medications ?? []).map((med) => ({
      name: med.name ?? "",
      dosage: med.dosage ?? "",
      frequency: med.frequency ?? "",
      start_date: med.start_date,
      end_date: med.end_date,
      notes: med.notes,
    })),
    symptoms: (profile.symptoms ?? []).map((sym) => ({
      name: sym.name ?? "",
      severity: sym.severity ?? "",
      onset_date: sym.onset_date,
      notes: sym.notes,
    })),
  };
}

export function patientDisplayName(data: PatientKnowledgeResponse): string {
  const name = `${data.patient.first_name ?? ""} ${data.patient.last_name ?? ""}`.trim();
  return name || `Patient #${data.patient.user_id}`;
}

export function formSeedKey(seed: ProfileFormSeed): string {
  return [
    seed.diagnosis,
    seed.comorbidities,
    seed.physician_notes,
    seed.age,
    seed.weight,
    seed.height,
    seed.gender,
    seed.medications.length,
    seed.symptoms.length,
  ].join("|");
}
