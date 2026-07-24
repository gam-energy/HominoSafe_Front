'use client';

import { Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { SupportTicketsPanel } from '@/features/applications/components/SupportTicketsPanel';
import { AdminSupportTicketsPanel } from '@/features/applications/components/AdminSupportTicketsPanel';
import PageContainer from '@/components/layout/page-container';
import { LoaderIcon } from '@/components/chat/icons';

function SupportTicketsBody() {
  const { user } = useUser();
  const role = String(user?.role || '').toLowerCase();
  if (role === 'admin') return <AdminSupportTicketsPanel />;
  return <SupportTicketsPanel />;
}

export default function SupportTicketsPage() {
  return (
    <PageContainer scrollable>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <LoaderIcon size={32} />
          </div>
        }
      >
        <SupportTicketsBody />
      </Suspense>
    </PageContainer>
  );
}
