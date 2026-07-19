'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '../types/applications';
import { statusLabelKey } from '../utils/applications';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200',
  under_review:
    'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200',
  payment_pending:
    'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-200',
  payment_submitted:
    'bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950 dark:text-violet-200',
  approved:
    'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-200',
};

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold', STATUS_STYLES[status], className)}
    >
      {t(statusLabelKey(status), status.replace(/_/g, ' '))}
    </Badge>
  );
}
