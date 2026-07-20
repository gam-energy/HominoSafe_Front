'use client';

import { useEffect, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

import { useGetPatientProfile } from '@/features/patients-list/api/use-get-patient-profile';
import {
  isUuidLike,
  patientPublicRef,
  staffPatientRoutes,
} from '@/features/patient-knowledge/utils/staffRoutes';
import { useUser } from '@/context/UserContext';

/** Resolve `/dashboard/patients/[id]` (or my-patients) where `id` is UUID (or legacy numeric). */
export function useStaffPatientRoute() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const routeRef = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return (raw || '').trim();
  }, [params.id]);

  const profileQuery = useGetPatientProfile(routeRef || undefined);
  const patient = profileQuery.data
    ? Array.isArray(profileQuery.data)
      ? profileQuery.data[0]
      : profileQuery.data
    : undefined;

  const userId = patient?.id;
  const publicRef = patient ? patientPublicRef(patient) : routeRef;
  const routes = staffPatientRoutes(user?.role, publicRef || routeRef);

  // Canonicalize legacy numeric URLs to UUID once profile is loaded.
  useEffect(() => {
    if (!patient?.uuid || !routeRef || !pathname) return;
    if (isUuidLike(routeRef)) return;
    if (routeRef === patient.uuid) return;
    const segment = pathname.includes('/my-patients/')
      ? 'my-patients'
      : 'patients';
    const needle = `/${segment}/${routeRef}`;
    if (!pathname.includes(needle)) return;
    router.replace(pathname.replace(needle, `/${segment}/${patient.uuid}`));
  }, [patient?.uuid, routeRef, pathname, router]);

  return {
    routeRef,
    patient,
    userId,
    publicRef,
    routes,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
  };
}
