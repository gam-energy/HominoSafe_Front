"use client";

import { ClinicalAgentReport } from "@/features/clinical-agent/components/ClinicalAgentReport";
import { StaffPatientNav } from "@/features/patients-list/components/StaffPatientNav";
import { useStaffPatientRoute } from "@/features/patients-list/hooks/useStaffPatientRoute";
import { useUser } from "@/context/UserContext";
import { LoaderIcon } from "@/components/chat/icons";

export default function CaregiverClinicalAgentPageClient() {
  const { user } = useUser();
  const { patient, userId, publicRef, isLoading } = useStaffPatientRoute();

  if (isLoading || !userId) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderIcon size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StaffPatientNav
        role={user?.role}
        patientRef={publicRef}
        patientId={userId}
        patientUuid={patient?.uuid}
      />
      <ClinicalAgentReport patientId={userId} />
    </div>
  );
}
