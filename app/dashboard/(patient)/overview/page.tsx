"use client";

import { useUser } from '@/context/UserContext';
import Dashboard from '@/features/dashboard/components/patient/Dashboard';
import { redirect } from 'next/navigation';

export default function PatientPage() {
  const { user } = useUser();

  if (!user || user.role !== 'patient') {
    redirect('/auth/sign-in');
  }

  return <Dashboard />;
}
