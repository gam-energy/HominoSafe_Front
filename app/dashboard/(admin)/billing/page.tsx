'use client';

import { useTranslation } from 'react-i18next';
import { useUser } from '@/context/UserContext';
import { AdminBillingOverview } from '@/features/admin/components/AdminBillingOverview';
import { ClinicAppointmentBilling } from '@/features/admin/components/ClinicAppointmentBilling';
import { MyAppointmentDebtsBilling } from '@/features/admin/components/MyAppointmentDebtsBilling';
import { LoaderIcon } from '@/components/chat/icons';
import PageContainer from '@/components/layout/page-container';

export default function BillingPage() {
  const { t } = useTranslation();
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
        <AdminBillingOverview />
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
      <MyAppointmentDebtsBilling
        title={
          role === 'patient'
            ? t('my_billing', 'My billing')
            : t('appointment_billing', 'Appointment billing')
        }
        description={
          role === 'patient'
            ? t(
                'billing_with_plan_desc',
                'Your subscription plan and charges from completed appointments.',
              )
            : t(
                'appointment_billing_desc',
                'Visit charges linked to your appointments.',
              )
        }
      />
    </PageContainer>
  );
}
