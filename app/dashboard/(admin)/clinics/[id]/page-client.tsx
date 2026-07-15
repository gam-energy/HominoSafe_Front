'use client';

import { useParams } from 'next/navigation';
import { ClinicDetail } from '@/features/admin/components/ClinicDetail';

export default function ClinicDetailPageClient() {
  const params = useParams<{ id: string }>();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const clinicId = Number(idStr);
  if (!clinicId) {
    return <div className="p-6 text-sm text-muted-foreground">Invalid clinic id.</div>;
  }
  return <ClinicDetail clinicId={clinicId} />;
}
