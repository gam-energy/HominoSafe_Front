'use client';

import { useUser } from '@/context/UserContext';
import { AdminInsightsOverview } from '@/features/admin/components/AdminInsightsOverview';
import { LoaderIcon } from '@/components/chat/icons';
import PageContainer from '@/components/layout/page-container';

export default function AdminInsightsPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderIcon size={32} />
      </div>
    );
  }

  if (String(user.role || '').toLowerCase() !== 'admin') {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <AdminInsightsOverview />
    </PageContainer>
  );
}
