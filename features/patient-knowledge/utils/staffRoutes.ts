export function staffPatientRoutes(role: string | undefined, patientId: number) {
  const isCaregiver = role === "caregiver";
  const listRoute = isCaregiver ? "/dashboard/my-patients" : "/dashboard/patients";

  return {
    listRoute,
    detailRoute: `${listRoute}/${patientId}`,
    importRoute: isCaregiver
      ? `/dashboard/my-patients/${patientId}/import`
      : `/dashboard/patients/${patientId}/import`,
    clinicalAgentRoute: isCaregiver
      ? `/dashboard/my-patients/${patientId}/clinical-agent`
      : `/dashboard/patients/${patientId}/clinical-agent`,
  };
}

export function isStaffRole(role?: string): boolean {
  return role === "doctor" || role === "caregiver";
}
