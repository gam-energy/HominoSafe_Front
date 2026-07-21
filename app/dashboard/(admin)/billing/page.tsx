'use client';

import { useUser } from '@/context/UserContext';
import { AdminBillingOverview } from '@/features/admin/components/AdminBillingOverview';
import { ClinicAppointmentBilling } from '@/features/admin/components/ClinicAppointmentBilling';
import { LoaderIcon } from '@/components/chat/icons';

export default function BillingPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderIcon size={32} />
      </div>
    );
  }

  const role = String(user.role || '').toLowerCase();
  if (role === 'clinic_admin') {
    return <ClinicAppointmentBilling />;
  }

  // System admin (and any other staff with access) see yearly + appointment debts.
  return <AdminBillingOverview />;
}
