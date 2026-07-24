'use client';

import { Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { AdminBillingOverview } from '@/features/admin/components/AdminBillingOverview';
import { ClinicAppointmentBilling } from '@/features/admin/components/ClinicAppointmentBilling';
import { MyAppointmentDebtsBilling } from '@/features/admin/components/MyAppointmentDebtsBilling';
import { LoaderIcon } from '@/components/chat/icons';
import PageContainer from '@/components/layout/page-container';

function AdminBillingSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoaderIcon size={32} />
        </div>
      }
    >
      <AdminBillingOverview />
    </Suspense>
  );
}

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
    return (
      <PageContainer scrollable>
        <AdminBillingSuspense />
      </PageContainer>
    );
  }
  if (role === 'clinic_admin') {
    return (
      <PageContainer scrollable>
        <ClinicAppointmentBilling />
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <MyAppointmentDebtsBilling />
    </PageContainer>
  );
}
