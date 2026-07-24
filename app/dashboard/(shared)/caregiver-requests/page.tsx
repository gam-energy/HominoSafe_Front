'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = new URLSearchParams(searchParams.toString());
    if (!qs.get('category')) qs.set('category', 'caregiver_request');
    router.replace(`/dashboard/support-tickets?${qs.toString()}`);
  }, [router, searchParams]);
  return null;
}

/** Legacy path — redirect into categorized support tickets. */
export default function CaregiverRequestsRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  );
}
