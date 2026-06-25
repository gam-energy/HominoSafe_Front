"use client"
import { useUser } from '@/context/UserContext';
import CaregiverDashboard from '@/features/patients-list/components/CaregiverDashboard'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const page = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useUser();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter();
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (user === null) return;

    if (!user?.id) {
      router.replace("/auth/sign-in");
      return;
    }

    // Redirect users who are not caregivers away from the caregiver patient list.
    switch (user.role) {
      case "admin":
        router.replace("/dashboard/users");
        break;
      case "patient":
        router.replace("/dashboard/overview");
        break;
      case "doctor":
        router.replace("/dashboard/doctor-overview");
        break;
      case "caregiver":
        // Caregivers belong here; do not redirect.
        break;
      default:
        router.replace("/dashboard/overview");
        break;
    }
  }, [user, router]);
  
  return (
    <CaregiverDashboard />
  )
}

export default page