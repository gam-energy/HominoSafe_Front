'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Pencil,
  Percent,
  Search,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  useAllBillings,
  useAllAppointmentDebts,
  useUpdateBilling,
  useUpdateAdminAppointmentDebt,
  type ClinicBilling,
  type ClinicBillingRow,
  type AppointmentDebt,
} from '../api/use-clinics';
import { useAdminSubscriptions } from '@/features/orders/api/use-orders';
import { BillingDialog } from './BillingDialog';
import { Badge } from '@/components/ui/badge';

type BillingTab = 'all' | 'b2c' | 'b2b' | 'debts';

function moneyEur(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

const STATUSES: ClinicBilling['status'][] = ['unpaid', 'paid', 'overdue', 'waived'];

export function AdminBillingOverview() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const tab: BillingTab =
    tabParam === 'b2c' || tabParam === 'b2b' || tabParam === 'debts' || tabParam === 'all'
      ? tabParam
      : 'all';

  const setTab = (next: BillingTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const showB2c = tab === 'all' || tab === 'b2c';
  const showB2b = tab === 'all' || tab === 'b2b';
  const showDebts = tab === 'all' || tab === 'debts';

  const { data, isLoading, error } = useAllBillings();
  const update = useUpdateBilling();
  const debtsQuery = useAllAppointmentDebts();
  const updateDebt = useUpdateAdminAppointmentDebt();
  const subsQuery = useAdminSubscriptions();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<string>('all');
  const [editing, setEditing] = useState<ClinicBillingRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const planLabel = (plan?: string) => {
    if (plan === 'b2c_annual') return t('plan_annual_eur', 'Annual · €780/year');
    if (plan === 'b2c_monthly') return t('plan_monthly_eur', 'Monthly · €65/month');
    return plan || '—';
  };

  const formatWhen = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      // Fixed locale on first paint; fa-IR only after language hydrate (post-mount).
      const locale =
        typeof window !== 'undefined' && i18n.language?.startsWith('fa')
          ? 'fa-IR'
          : 'en-US';
      return new Date(iso).toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'unpaid') return t('unpaid', 'Unpaid');
    if (s === 'paid') return t('paid', 'Paid');
    if (s === 'overdue') return t('overdue', 'Overdue');
    if (s === 'waived') return t('waived', 'Waived');
    return s;
  };

  const rows = useMemo(() => {
    let src = data ?? [];
    if (statusFilter !== 'all') src = src.filter((r) => r.status === statusFilter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      src = src.filter((r) =>
        [r.clinic_name, r.invoice_number, r.notes, String(r.year)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return src;
  }, [data, q, statusFilter]);

  const kpis = useMemo(() => {
    const all = data ?? [];
    const totalBilled = all.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalPaid = all
      .filter((r) => r.status === 'paid')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const unpaidAmt = all
      .filter((r) => r.status === 'unpaid')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const overdueAmt = all
      .filter((r) => r.status === 'overdue')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const waivedAmt = all
      .filter((r) => r.status === 'waived')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const clinics = new Set(all.map((r) => r.clinic_id)).size;
    const years = new Set(all.map((r) => r.year)).size;
    return {
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      overdueCount: all.filter((r) => r.status === 'overdue').length,
      unpaidCount: all.filter((r) => r.status === 'unpaid').length,
      paidCount: all.filter((r) => r.status === 'paid').length,
      unpaidAmt,
      overdueAmt,
      waivedAmt,
      clinics,
      years,
      collection: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0,
      avgInvoice: all.length ? totalBilled / all.length : 0,
    };
  }, [data]);

  const quickStatus = async (row: ClinicBillingRow, status: ClinicBilling['status']) => {
    try {
      await update.mutateAsync({
        billingId: row.id,
        payload: { status },
      });
      toast.success(
        t('billing_marked_status', {
          defaultValue: '{{name}} {{year}} marked {{status}}',
          name: row.clinic_name,
          year: row.year,
          status: statusLabel(status),
        }),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('failed_to_update', 'Failed to update'));
    }
  };

  const tabs: { id: BillingTab; label: string }[] = [
    { id: 'all', label: t('all', 'All') },
    { id: 'b2c', label: t('nest_subscriptions', 'Nest subscriptions') },
    { id: 'b2b', label: t('clinic_invoices', 'Clinic invoices') },
    { id: 'debts', label: t('appointment_debts', 'Appointment debts') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('billing', 'Billing')}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'admin_billing_body',
              'Nest subscription plans (€780/year · €65/month), clinic yearly invoices, and appointment debts.',
            )}
          </p>
        </div>
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-full border border-zinc-200/80 bg-muted/40 p-1 dark:border-zinc-800/80">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              tab === item.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showB2c ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-5 w-5 text-primary" />
              {t('nest_subscription_plans', 'Nest subscription plans')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(
                'nest_subscription_plans_body',
                'Annual €780 · Monthly €65. Starts on Nest activation (or 30 days after delivery).',
              )}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {subsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                {t('loading_subscriptions', 'Loading subscriptions…')}
              </div>
            ) : subsQuery.isError ? (
              <div className="py-10 text-center text-sm text-destructive">
                {t('failed_load_subscriptions', 'Failed to load subscriptions.')}
              </div>
            ) : (subsQuery.data ?? []).length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t('no_nest_subscriptions', 'No Nest subscriptions yet.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-start text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">{t('patient', 'Patient')}</th>
                      <th className="px-4 py-3">{t('plan', 'Plan')}</th>
                      <th className="px-4 py-3 text-end">{t('amount', 'Amount')}</th>
                      <th className="px-4 py-3">{t('status', 'Status')}</th>
                      <th className="px-4 py-3">{t('ends', 'Ends')}</th>
                      <th className="px-4 py-3 text-end">{t('days_left', 'Days left')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subsQuery.data ?? []).map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.patient_name}</div>
                          <div className="text-xs text-muted-foreground">
                            @{s.patient_username}
                          </div>
                        </td>
                        <td className="px-4 py-3">{planLabel(s.plan)}</td>
                        <td className="px-4 py-3 text-end font-semibold tabular-nums">
                          {moneyEur(s.amount, s.currency || 'EUR')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {t(String(s.status), {
                              defaultValue: String(s.status).replace(/_/g, ' '),
                            })}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatWhen(s.end_date)}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums">{s.days_remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {showB2b ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t('total_billed', 'Total billed')}
              value={`€${kpis.totalBilled.toFixed(0)}`}
              sub={t('avg_per_invoice', {
                defaultValue: 'Avg €{{amount}} / invoice',
                amount: kpis.avgInvoice.toFixed(0),
              })}
              icon={<CreditCard className="h-4 w-4" />}
              tone="emerald"
            />
            <Stat
              label={t('collected', 'Collected')}
              value={`€${kpis.totalPaid.toFixed(0)}`}
              sub={t('paid_records_count', {
                defaultValue: '{{count}} paid records',
                count: kpis.paidCount,
              })}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="teal"
            />
            <Stat
              label={t('outstanding', 'Outstanding')}
              value={`€${kpis.outstanding.toFixed(0)}`}
              sub={t('unpaid_amount_sub', {
                defaultValue: '€{{amount}} unpaid',
                amount: kpis.unpaidAmt.toFixed(0),
              })}
              icon={<Wallet className="h-4 w-4" />}
              tone="amber"
            />
            <Stat
              label={t('collection_rate', 'Collection rate')}
              value={`${kpis.collection}%`}
              sub={t('paid_over_billed', 'Paid / billed')}
              icon={<Percent className="h-4 w-4" />}
              tone="emerald"
            />
            <Stat
              label={t('overdue', 'Overdue')}
              value={kpis.overdueCount}
              sub={t('overdue_amount_sub', {
                defaultValue: '€{{amount}} overdue',
                amount: kpis.overdueAmt.toFixed(0),
              })}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={kpis.overdueCount > 0 ? 'rose' : 'slate'}
            />
            <Stat
              label={t('unpaid_years', 'Unpaid years')}
              value={kpis.unpaidCount}
              icon={<Wallet className="h-4 w-4" />}
              tone="amber"
            />
            <Stat
              label={t('clinics_billed', 'Clinics billed')}
              value={kpis.clinics}
              sub={t('billing_years_count', {
                defaultValue: '{{count}} billing years',
                count: kpis.years,
              })}
              icon={<Building2 className="h-4 w-4" />}
              tone="blue"
            />
            <Stat
              label={t('waived', 'Waived')}
              value={`€${kpis.waivedAmt.toFixed(0)}`}
              icon={<CreditCard className="h-4 w-4" />}
              tone="slate"
            />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
              <CardTitle>{t('clinic_billing_records', 'Clinic billing records')}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('search_clinic_invoice_ph', 'Search clinic / invoice…')}
                    className="h-9 w-56 ps-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_statuses', 'All statuses')}</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('loading_billing', 'Loading billing…')}
                </div>
              ) : error ? (
                <div className="py-10 text-center text-sm text-destructive">
                  {String(error.message)}
                </div>
              ) : rows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t(
                    'no_billing_records',
                    'No billing records. Add billing from a clinic page.',
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-start text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{t('clinic', 'Clinic')}</th>
                        <th className="px-4 py-3">{t('year', 'Year')}</th>
                        <th className="px-4 py-3 text-end">{t('amount', 'Amount')}</th>
                        <th className="px-4 py-3">{t('status', 'Status')}</th>
                        <th className="px-4 py-3">{t('due', 'Due')}</th>
                        <th className="px-4 py-3">{t('invoice', 'Invoice')}</th>
                        <th className="px-4 py-3 text-end">{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/clinics/${r.clinic_id}`}
                              className="font-medium hover:underline"
                            >
                              {r.clinic_name ?? '—'}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{r.year}</td>
                          <td className="px-4 py-3 text-end">
                            {r.currency} {Number(r.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={r.status}
                              onValueChange={(v) =>
                                quickStatus(r, v as ClinicBilling['status'])
                              }
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {statusLabel(s)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {r.due_date ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {r.invoice_number ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(r);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {showDebts ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
            <div>
              <CardTitle>{t('appointment_debts', 'Appointment debts')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'appointment_debts_admin_body',
                  'Visit charges created when appointments are completed.',
                )}
              </p>
            </div>
            <Select value={debtFilter} onValueChange={setDebtFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all', 'All')}</SelectItem>
                <SelectItem value="unpaid">{t('unpaid', 'Unpaid')}</SelectItem>
                <SelectItem value="paid">{t('paid', 'Paid')}</SelectItem>
                <SelectItem value="waived">{t('waived', 'Waived')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            {debtsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                {t('loading_appointment_debts', 'Loading appointment debts…')}
              </div>
            ) : debtsQuery.isError ? (
              <div className="py-10 text-center text-sm text-destructive">
                {t('failed_load_appointment_debts', 'Failed to load appointment debts.')}
              </div>
            ) : (
              (() => {
                const debts = (debtsQuery.data ?? []).filter((d) =>
                  debtFilter === 'all' ? true : d.status === debtFilter,
                );
                if (debts.length === 0) {
                  return (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {t('no_appointment_debts', 'No appointment debts yet.')}
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/40 text-start text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">{t('patient', 'Patient')}</th>
                          <th className="px-4 py-3">{t('doctor', 'Doctor')}</th>
                          <th className="px-4 py-3">{t('clinic', 'Clinic')}</th>
                          <th className="px-4 py-3">{t('when', 'When')}</th>
                          <th className="px-4 py-3 text-end">{t('amount', 'Amount')}</th>
                          <th className="px-4 py-3">{t('status', 'Status')}</th>
                          <th className="px-4 py-3 text-end">{t('actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debts.map((d: AppointmentDebt) => (
                          <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">
                              {d.patient_name || `#${d.patient_id}`}
                            </td>
                            <td className="px-4 py-3">{d.doctor_name || '—'}</td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/clinics/${d.clinic_id}`}
                                className="hover:underline"
                              >
                                {d.clinic_name || `#${d.clinic_id}`}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {formatWhen(d.scheduled_at || d.charged_at)}
                            </td>
                            <td className="px-4 py-3 text-end tabular-nums">
                              {d.currency} {Number(d.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{statusLabel(d.status)}</Badge>
                            </td>
                            <td className="px-4 py-3 text-end">
                              <div className="inline-flex gap-1">
                                {d.status !== 'paid' ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={updateDebt.isPending}
                                    onClick={async () => {
                                      try {
                                        await updateDebt.mutateAsync({
                                          debtId: d.id,
                                          status: 'paid',
                                        });
                                        toast.success(
                                          t('marked_paid_toast', 'Marked paid'),
                                        );
                                      } catch (err: any) {
                                        toast.error(
                                          err?.response?.data?.detail ||
                                            t('failed_to_update', 'Update failed'),
                                        );
                                      }
                                    }}
                                  >
                                    {t('mark_paid', 'Mark paid')}
                                  </Button>
                                ) : null}
                                {d.status !== 'waived' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updateDebt.isPending}
                                    onClick={async () => {
                                      try {
                                        await updateDebt.mutateAsync({
                                          debtId: d.id,
                                          status: 'waived',
                                        });
                                        toast.success(t('waived_toast', 'Waived'));
                                      } catch (err: any) {
                                        toast.error(
                                          err?.response?.data?.detail ||
                                            t('failed_to_update', 'Update failed'),
                                        );
                                      }
                                    }}
                                  >
                                    {t('waive', 'Waive')}
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      ) : null}

      {editing && (
        <BillingDialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setEditing(null);
          }}
          clinicId={editing.clinic_id}
          billing={editing}
        />
      )}
    </div>
  );
}

const TONES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
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
          {icon && <span className={`inline-flex rounded-md p-1.5 ${TONES[tone]}`}>{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
