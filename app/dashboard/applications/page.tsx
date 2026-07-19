'use client';

import { ApplicationsReviewPanel } from '@/features/applications/components/ApplicationsReviewPanel';

export default function DashboardApplicationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <ApplicationsReviewPanel />
    </div>
  );
}
