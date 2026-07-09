export function staffPatientRoutes(role: string | undefined, patientId: number) {
  const isCaregiver = role === "caregiver";
  const listRoute = isCaregiver ? "/dashboard/my-patients" : "/dashboard/patients";
  const base = `${listRoute}/${patientId}`;

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
  return role === "doctor" || role === "caregiver";
}
