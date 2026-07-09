'use client';

import { useParams } from 'next/navigation';
import { AdminUserDetail } from '@/features/admin/components/AdminUserDetail';

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return null;
  return <AdminUserDetail userId={id} />;
}
