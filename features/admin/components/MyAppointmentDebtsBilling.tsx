'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Loader2,
  Percent,
  Search,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axiosInstance from '@/api/axiosInstance';
import type { AppointmentDebt } from '@/features/admin/api/use-clinics';
import { useMySubscription } from '@/features/orders/api/use-orders';

function money(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function planLabel(plan?: string) {
  if (plan === 'b2c_annual') return 'Annual plan (B2C) · €780/year';
  if (plan === 'b2c_monthly') return 'Monthly plan (B2C) · €65/month';
  return plan || '—';
}

const TONES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  emerald:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

function Stat({
  label,
  value,
  icon,
  sub,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          {icon ? (
            <span className={`inline-flex rounded-md p-1.5 ${TONES[tone]}`}>
              {icon}
            </span>
          ) : null}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MyAppointmentDebtsBilling({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const subQuery = useMySubscription();

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-appointment-billing-debts'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<AppointmentDebt[]>(
        '/appointments/me/billing-debts',
      );
      return data;
    },
  });

  const kpis = useMemo(() => {
    const unpaidAmt = data
      .filter((d) => d.status === 'unpaid')
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const paidAmt = data
      .filter((d) => d.status === 'paid')
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const waivedAmt = data
      .filter((d) => d.status === 'waived')
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const total = unpaidAmt + paidAmt + waivedAmt;
    const planAmt = Number(subQuery.data?.amount || 0);
    return {
      unpaidAmt,
      paidAmt,
      waivedAmt,
      total,
      planAmt,
      unpaidCount: data.filter((d) => d.status === 'unpaid').length,
      paidCount: data.filter((d) => d.status === 'paid').length,
      collection: total > 0 ? Math.round((paidAmt / total) * 1000) / 10 : 0,
    };
  }, [data, subQuery.data]);

  const rows = useMemo(() => {
    let src = data;
    if (statusFilter !== 'all') {
      src = src.filter((d) => d.status === statusFilter);
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      src = src.filter((d) =>
        [d.patient_name, d.doctor_name, d.notes, String(d.appointment_id)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return src;
  }, [data, q, statusFilter]);

  const sub = subQuery.data;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {title || t('billing', 'Billing')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {description ||
              t(
                'billing_with_plan_desc',
                'Your subscription plan and charges from completed appointments.',
              )}
          </p>
        </div>
      </div>

      <Card
        className={
          sub?.status === 'active'
            ? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
            : undefined
        }
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-5 w-5 text-primary" />
            {t('subscription_plan', 'Subscription plan')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subQuery.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading', 'Loading...')}
            </div>
          ) : !sub ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t(
                'no_subscription_plan',
                'No subscription plan on file yet. B2C annual is €780/year (€65/month).',
              )}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('plan', 'Plan')}</p>
                <p className="text-lg font-semibold">{planLabel(sub.plan)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('amount', 'Amount')}
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {money(sub.amount, sub.currency || 'EUR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('status', 'Status')}
                </p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {String(sub.status).replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('remaining', 'Remaining')}
                </p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  {sub.days_remaining} {t('days', 'days')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t('subscription', 'Subscription')}
          value={money(kpis.planAmt, sub?.currency || 'EUR')}
          sub={planLabel(sub?.plan)}
          icon={<BadgeCheck className="h-4 w-4" />}
          tone="blue"
        />
        <Stat
          label={t('appointment_charges', 'Appointment charges')}
          value={money(kpis.total)}
          sub={`${data.length} ${t('records', 'records')}`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label={t('unpaid', 'Unpaid')}
          value={money(kpis.unpaidAmt)}
          sub={`${kpis.unpaidCount} ${t('open_debts', 'open debts')}`}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <Stat
          label={t('collection_rate', 'Collection rate')}
          value={`${kpis.collection}%`}
          sub={t('paid_over_billed', 'Paid / billed')}
          icon={<Percent className="h-4 w-4" />}
          tone="teal"
        />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between space-y-0 gap-3">
          <CardTitle>{t('appointment_debts', 'Appointment debts')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search', 'Search…')}
                className="h-9 w-48 ps-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_statuses', 'All statuses')}</SelectItem>
                <SelectItem value="unpaid">{t('unpaid', 'Unpaid')}</SelectItem>
                <SelectItem value="paid">{t('paid', 'Paid')}</SelectItem>
                <SelectItem value="waived">{t('waived', 'Waived')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />{' '}
              {t('loading', 'Loading...')}
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-sm text-destructive">
              {(error as Error)?.message ||
                t('failed_load_debts', 'Failed to load appointment debts.')}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('no_appointment_debts', 'No appointment debts yet.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t('patient', 'Patient')}</th>
                    <th className="px-4 py-3">{t('doctor', 'Doctor')}</th>
                    <th className="px-4 py-3">{t('when', 'When')}</th>
                    <th className="px-4 py-3 text-right">
                      {t('amount', 'Amount')}
                    </th>
                    <th className="px-4 py-3">{t('status', 'Status')}</th>
                    <th className="px-4 py-3">{t('notes', 'Notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium">
                        {d.patient_name || `#${d.patient_id}`}
                      </td>
                      <td className="px-4 py-3">{d.doctor_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatWhen(d.scheduled_at || d.charged_at)}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-semibold tabular-nums">
                        {money(d.amount, d.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-xs text-muted-foreground">
                        {d.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
