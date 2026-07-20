export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

/** Prefer stable public UUID for patient URLs; fall back to numeric id. */
export function patientPublicRef(patient: {
  id: number;
  uuid?: string | null;
}): string {
  const uuid = patient.uuid?.trim();
  return uuid || String(patient.id);
}

export function staffPatientRoutes(
  role: string | undefined,
  patientRef: string | number,
) {
  const isCaregiver = role === 'caregiver';
  const listRoute = isCaregiver
    ? '/dashboard/my-patients'
    : '/dashboard/patients';
  const base = `${listRoute}/${patientRef}`;

  return {
    listRoute,
    detailRoute: base,
    medicalProfileRoute: `${base}/medical-profile`,
    healthKpisRoute: `${base}/health-kpis`,
    importRoute: `${base}/import`,
    clinicalAgentRoute: `${base}/clinical-agent`,
  };
}

export function isStaffRole(role?: string): boolean {
  return role === 'doctor' || role === 'caregiver';
}
