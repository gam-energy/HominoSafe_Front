'use client';

import { useUser } from '@/context/UserContext';
import { AdminBillingOverview } from '@/features/admin/components/AdminBillingOverview';
import { ClinicAppointmentBilling } from '@/features/admin/components/ClinicAppointmentBilling';
import { MyAppointmentDebtsBilling } from '@/features/admin/components/MyAppointmentDebtsBilling';
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

  if (role === 'admin') {
    return <AdminBillingOverview />;
  }
  if (role === 'clinic_admin') {
    return <ClinicAppointmentBilling />;
  }
  // Patient / doctor / caregiver: show debts they are allowed to see
  // (patient Mahdi → his visit charges; doctor → charges for their visits).
  return (
    <MyAppointmentDebtsBilling
      title={role === 'patient' ? 'My billing' : 'Appointment billing'}
      description={
        role === 'patient'
          ? 'Charges from your completed appointments.'
          : 'Visit charges linked to your appointments.'
      }
    />
  );
}
