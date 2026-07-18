'use client';

import { useMySubscription } from '@/features/orders/api/use-orders';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, CalendarClock, Loader2 } from 'lucide-react';

export function SubscriptionBanner() {
  const { data, isLoading } = useMySubscription();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading subscription…
      </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const active = data.status === 'active';
  const endDate = data.end_date ? new Date(data.end_date) : null;

  return (
    <Card
      className={
        'border ' +
        (active
          ? 'border-emerald-200/50 bg-emerald-50/60 dark:border-emerald-900/30 dark:bg-emerald-950/10'
          : 'border-amber-200/50 bg-amber-50/60 dark:border-amber-900/30 dark:bg-amber-950/10')
      }
    >
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className={'h-5 w-5 ' + (active ? 'text-emerald-600' : 'text-amber-600')} />
          <div>
            <p className="text-sm font-bold capitalize">
              {data.status.replace('_', ' ')} subscription
            </p>
            <p className="text-xs text-muted-foreground">
              {data.plan === 'b2c_annual' ? 'Annual plan' : 'Monthly plan'} · €
              {data.amount.toFixed(0)} {data.currency}
            </p>
          </div>
        </div>
        {endDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>
              {active
                ? `${data.days_remaining} days remaining`
                : `Ends ${endDate.toLocaleDateString()}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
