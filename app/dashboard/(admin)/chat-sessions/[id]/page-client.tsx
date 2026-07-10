'use client';

import { useParams } from 'next/navigation';
import { AdminChatSessionMessages } from '@/features/admin/components/AdminChatSessionMessages';

export default function AdminChatSessionDetailPageClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return null;
  return <AdminChatSessionMessages sessionId={id} />;
}
