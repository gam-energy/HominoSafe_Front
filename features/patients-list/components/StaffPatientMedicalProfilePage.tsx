'use client';

import { useMemo } from 'react';

import { MedicalProfileView } from '@/features/medical-profile/components/medicalProfile';
import { StaffPatientNav } from '@/features/patients-list/components/StaffPatientNav';
import { useStaffPatientRoute } from '@/features/patients-list/hooks/useStaffPatientRoute';
import { useUser } from '@/context/UserContext';
import { LoaderIcon } from '@/components/chat/icons';

export default function StaffPatientMedicalProfilePage() {
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
      <MedicalProfileView
        patientId={userId}
        patientName={patientName}
        backRoute={routes.detailRoute}
      />
    </div>
  );
}
