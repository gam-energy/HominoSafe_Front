'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { HealthKpisPanel } from '@/features/dashboard/components/patient/HealthKpisPanel';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useGetPatientProfile } from '@/features/patients-list/api/use-get-patient-profile';
import { useUser } from '@/context/UserContext';
import { staffPatientRoutes } from '@/features/patient-knowledge/utils/staffRoutes';

export default function StaffPatientHealthKpisPage() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const userId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const routes = staffPatientRoutes(user?.role, userId);

  const { data: patientInfoData } = useGetPatientProfile(userId);
  const patientName = useMemo(() => {
    if (!patientInfoData) return undefined;
    const info = Array.isArray(patientInfoData)
      ? patientInfoData[0]
      : patientInfoData;
    return info
      ? `${info.first_name ?? ''} ${info.last_name ?? ''}`.trim()
      : undefined;
  }, [patientInfoData]);

  return (
    <div className="flex flex-col gap-4">
      <StaffPatientNav role={user?.role} patientId={userId} />
      <HealthKpisPanel
        patientName={patientName}
        userId={userId}
        backRoute={routes.detailRoute}
      />
    </div>
  );
}
