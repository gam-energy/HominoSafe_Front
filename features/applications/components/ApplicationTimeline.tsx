'use client';

import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '../types/applications';
import { APPLICATION_TIMELINE } from '../types/applications';
import { statusLabelKey, timelineStepIndex } from '../utils/applications';

export function ApplicationTimeline({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  const currentIdx = timelineStepIndex(status);
  const rejected = status === 'rejected';

  return (
    <ol className="space-y-0" aria-label={t('app_timeline', 'Application progress')}>
      {APPLICATION_TIMELINE.map((step, idx) => {
        const done = !rejected && currentIdx > idx;
        const current = !rejected && currentIdx === idx;
        const upcoming = rejected || currentIdx < idx;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  current && 'border-primary bg-primary text-primary-foreground',
                  upcoming && 'border-muted-foreground/30 bg-background text-muted-foreground'
                )}
                aria-current={current ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : idx + 1}
              </span>
              {idx < APPLICATION_TIMELINE.length - 1 && (
                <span
                  className={cn(
                    'my-1 w-0.5 flex-1 min-h-6',
                    done ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className={cn('pb-6 pt-1', idx === APPLICATION_TIMELINE.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-semibold',
                  current && 'text-foreground',
                  done && 'text-emerald-700 dark:text-emerald-400',
                  upcoming && 'text-muted-foreground'
                )}
              >
                {t(statusLabelKey(step), step.replace(/_/g, ' '))}
              </p>
            </div>
          </li>
        );
      })}

      {rejected && (
        <li className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
            <X className="h-4 w-4" aria-hidden />
          </span>
          <div className="pt-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {t(statusLabelKey('rejected'), 'Rejected')}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
