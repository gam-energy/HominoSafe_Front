'use client';

export {
  emptyStaticParams as generateStaticParams,
  mobileDynamicParams as dynamicParams,
} from '@/lib/staticExportHelpers';

import { useParams } from 'next/navigation';

import { PatientImportPage } from '@/features/patient-knowledge/components/PatientImportPage';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useUser } from '@/context/UserContext';

export default function CaregiverPatientImportPage() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const patientId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  return (
    <div className="flex flex-col gap-4">
      <StaffPatientNav role={user?.role} patientId={patientId} />
      <PatientImportPage />
    </div>
  );
}
