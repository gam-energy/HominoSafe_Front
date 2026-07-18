'use client';

import { useUser } from '@/context/UserContext';
import AppointmentsPanel from '@/features/appointments/components/AppointmentsPanel';
import { Loader2 } from 'lucide-react';
import type { Role } from '@/constant/data';

export default function AppointmentsPage() {
  const { user } = useUser();
  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  return <AppointmentsPanel role={user.role as Role} />;
}
