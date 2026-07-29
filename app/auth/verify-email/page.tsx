'use client';

import { Suspense } from 'react';
import VerifyEmailForm from '@/features/auth/components/VerifyEmailForm';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
