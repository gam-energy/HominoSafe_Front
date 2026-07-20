'use client';

import { useMemo } from 'react';

import { HealthKpisPanel } from '@/features/dashboard/components/patient/HealthKpisPanel';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useStaffPatientRoute } from '@/features/patients-list/hooks/useStaffPatientRoute';
import { useUser } from '@/context/UserContext';
import { LoaderIcon } from '@/components/chat/icons';

export default function StaffPatientHealthKpisPage() {
  const { user } = useUser();
  const { patient, userId, publicRef, routes, isLoading } =
    useStaffPatientRoute();

  const patientName = useMemo(() => {
    if (!patient) return undefined;
    return `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim();
  }, [patient]);

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
      <HealthKpisPanel
        patientName={patientName}
        userId={userId}
        backRoute={routes.detailRoute}
      />
    </div>
  );
}
