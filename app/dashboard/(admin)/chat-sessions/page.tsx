'use client';

import { useParams } from 'next/navigation';
import { AdminChatSessionsTable } from '@/features/admin/components/AdminChatSessionsTable';
import { Suspense } from 'react';

export default function AdminChatSessionsPage() {
  // useSearchParams must be wrapped in Suspense per Next.js requirements.
  return (
    <Suspense fallback={null}>
      <AdminChatSessionsTable />
    </Suspense>
  );
}
