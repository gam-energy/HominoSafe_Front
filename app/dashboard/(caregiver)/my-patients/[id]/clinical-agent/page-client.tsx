'use client';

import { useParams } from 'next/navigation';

import { ClinicalAgentReport } from '@/features/clinical-agent/components/ClinicalAgentReport';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useGetPatientProfile } from '@/features/patients-list/api/use-get-patient-profile';
import { useUser } from '@/context/UserContext';

export default function CaregiverClinicalAgentPageClient() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const patientId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: patient } = useGetPatientProfile(patientId);

  return (
    <div className="flex flex-col gap-4">
      <StaffPatientNav
        role={user?.role}
        patientId={patientId}
        patientUuid={patient?.uuid}
      />
      <ClinicalAgentReport />
    </div>
  );
}
