'use client';

import { useParams } from 'next/navigation';

import { ClinicalAgentReport } from '@/features/clinical-agent/components/ClinicalAgentReport';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useUser } from '@/context/UserContext';

export default function CaregiverClinicalAgentPage() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const patientId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  return (
    <div className="flex flex-col gap-4">
      <StaffPatientNav role={user?.role} patientId={patientId} />
      <ClinicalAgentReport />
    </div>
  );
}
