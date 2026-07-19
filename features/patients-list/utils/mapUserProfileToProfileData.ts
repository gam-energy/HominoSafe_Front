import type { UserProfile } from '@/features/dashboard/types/caregiver/medical-profile';
import type { ProfileData } from '@/features/medical-profile/types/medicalprofile';

/** Maps staff EHR profile (`/api/profile/all`) to patient medical profile shape. */
export function mapUserProfileToProfileData(
  profile: UserProfile
): ProfileData {
  return {
    ehr_id: profile.ehr_id,
    demographics: profile.demographics ?? '',
    comorbidities: profile.comorbidities ?? {},
    allergies: profile.allergies ?? [],
    diagnosis: profile.diagnosis ?? '',
    physician_notes: profile.physician_notes ?? '',
    timestamp: profile.timestamp,
    medications: profile.medications ?? [],
    symptoms: profile.symptoms ?? [],
  };
}

export function pickLatestUserProfile(
  profiles: UserProfile[] | undefined
): ProfileData | null {
  if (!profiles?.length) return null;

  const sorted = [...profiles].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return mapUserProfileToProfileData(sorted[0]);
}
