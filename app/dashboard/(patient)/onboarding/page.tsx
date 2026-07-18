'use client';

import { RecordClaimCard } from '@/features/orders/components/RecordClaimCard';

export default function OnboardingPage() {
  return (
    <section className="w-full min-h-[60vh] flex flex-col justify-center items-center p-4">
      <RecordClaimCard />
    </section>
  );
}
