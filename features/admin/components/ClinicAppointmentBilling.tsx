'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Percent,
  Search,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMyAppointmentDebtSummary,
  useMyAppointmentDebts,
  useMyDoctorPrices,
  useUpdateMyAppointmentDebt,
  useUpsertMyDoctorPrice,
  type AppointmentDebt,
  type DoctorAppointmentPrice,
} from '../api/use-clinics';

const EUR = 'EUR';

function money(amount: number, currency = EUR) {
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

function DoctorPriceRow({ row }: { row: DoctorAppointmentPrice }) {
  const { t } = useTranslation();
  const upsert = useUpsertMyDoctorPrice();
  const [amount, setAmount] = useState(String(row.amount ?? 0));
  const [active, setActive] = useState(Boolean(row.is_active));

  const dirty =
    Number(amount) !== Number(row.amount) ||
    active !== Boolean(row.is_active);

  const save = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error(t('invalid_amount', 'Enter a valid amount'));
      return;
    }
    try {
      await upsert.mutateAsync({
        doctorId: row.doctor_id,
        amount: value,
        currency: EUR,
        is_active: active,
      });
      toast.success(t('price_saved', 'Appointment price saved'));
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('save_failed', 'Failed to save price'));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{row.doctor_name}</p>
        <p className="text-xs text-muted-foreground">@{row.doctor_username}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            €
          </span>
          <Input
            type="number"
            min={0}
            step="0.01"
            className="w-32 ps-6"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Badge variant="outline">{EUR}</Badge>
        <Select
          value={active ? 'active' : 'inactive'}
          onValueChange={(v) => setActive(v === 'active')}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t('active', 'Active')}</SelectItem>
            <SelectItem value="inactive">{t('inactive', 'Inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!dirty || upsert.isPending}
          onClick={() => void save()}
        >
          {upsert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('save', 'Save')
          )}
        </Button>
      </div>
    </div>
  );
}

export function ClinicAppointmentBilling() {
  const { t } = useTranslation();
  const [debtFilter, setDebtFilter] = useState('all');
  const [q, setQ] = useState('');
  const prices = useMyDoctorPrices();
  const summary = useMyAppointmentDebtSummary();
  const debts = useMyAppointmentDebts(
    debtFilter === 'all' ? undefined : debtFilter,
  );
  const updateDebt = useUpdateMyAppointmentDebt();

  const unpaid = Number(summary.data?.unpaid || 0);
  const paid = Number(summary.data?.paid || 0);
  const waived = Number(summary.data?.waived || 0);
  const total = unpaid + paid + waived;
  const collection =
    total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;

  const doctorBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; unpaid: number; paid: number; count: number }
    >();
    for (const d of debts.data ?? []) {
      const key = String(d.doctor_id);
      const cur = map.get(key) || {
        name: d.doctor_name || `#${d.doctor_id}`,
        unpaid: 0,
        paid: 0,
        count: 0,
      };
      cur.count += 1;
      if (d.status === 'unpaid') cur.unpaid += Number(d.amount || 0);
      if (d.status === 'paid') cur.paid += Number(d.amount || 0);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.unpaid + b.paid - (a.unpaid + a.paid));
  }, [debts.data]);

  const rows = useMemo(() => {
    let src = debts.data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      src = src.filter((d) =>
        [d.patient_name, d.doctor_name, d.notes, String(d.appointment_id)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }
    return src;
  }, [debts.data, q]);

  const setStatus = async (
    debt: AppointmentDebt,
    status: AppointmentDebt['status'],
  ) => {
    try {
      await updateDebt.mutateAsync({ debtId: debt.id, status });
      toast.success(t('debt_updated', 'Debt updated'));
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('update_failed', 'Update failed'));
    }
  };

  const avgPrice =
    (prices.data ?? []).filter((p) => p.is_active).length > 0
      ? (prices.data ?? [])
          .filter((p) => p.is_active)
          .reduce((s, p) => s + Number(p.amount || 0), 0) /
        (prices.data ?? []).filter((p) => p.is_active).length
      : 0;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          {t('clinic_finance', 'Clinic finances')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            'clinic_finance_desc',
            'Appointment pricing and visit debts in euros (€). Set doctor rates and collect unpaid visits.',
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          label={t('unpaid', 'Unpaid')}
          value={money(unpaid)}
          sub={`${summary.data?.unpaid_count || 0} ${t('open_debts', 'open debts')}`}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <Stat
          label={t('collected', 'Collected')}
          value={money(paid)}
          sub={t('paid_visits', 'Paid visits')}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="teal"
        />
        <Stat
          label={t('collection_rate', 'Collection rate')}
          value={`${collection}%`}
          sub={t('paid_over_billed', 'Paid / billed')}
          icon={<Percent className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label={t('waived', 'Waived')}
          value={money(waived)}
          icon={<CreditCard className="h-4 w-4" />}
          tone="slate"
        />
        <Stat
          label={t('total_billed', 'Total billed')}
          value={money(total)}
          sub={`${(debts.data ?? []).length} ${t('visits', 'visits')}`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="blue"
        />
        <Stat
          label={t('avg_visit_price', 'Avg visit price')}
          value={money(avgPrice)}
          sub={t('active_doctor_rates', 'Active doctor rates')}
          icon={<Stethoscope className="h-4 w-4" />}
          tone="blue"
        />
      </div>

      {doctorBreakdown.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t('by_doctor', 'By doctor')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t('doctor', 'Doctor')}</th>
                    <th className="px-4 py-3 text-right">{t('visits', 'Visits')}</th>
                    <th className="px-4 py-3 text-right">{t('unpaid', 'Unpaid')}</th>
                    <th className="px-4 py-3 text-right">{t('paid', 'Paid')}</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorBreakdown.map((d) => (
                    <tr key={d.name} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {d.count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {money(d.unpaid)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {money(d.paid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="debts">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="debts">
            {t('appointment_debts', 'Appointment debts')}
          </TabsTrigger>
          <TabsTrigger value="prices">
            {t('doctor_pricing', 'Doctor pricing (€)')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts" className="mt-4">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between space-y-0 gap-3">
              <div>
                <CardTitle>
                  {t('appointment_debts', 'Appointment debts')}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    'appointment_debts_hint_eur',
                    'Created when a visit is completed. All amounts in euros.',
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('search', 'Search…')}
                    className="h-9 w-44 ps-8"
                  />
                </div>
                <Select value={debtFilter} onValueChange={setDebtFilter}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all', 'All')}</SelectItem>
                    <SelectItem value="unpaid">{t('unpaid', 'Unpaid')}</SelectItem>
                    <SelectItem value="paid">{t('paid', 'Paid')}</SelectItem>
                    <SelectItem value="waived">{t('waived', 'Waived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {debts.isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : debts.isError ? (
                <p className="py-16 text-center text-sm text-destructive">
                  {t(
                    'failed_load_debts',
                    'Failed to load appointment debts. Check your clinic admin access.',
                  )}
                </p>
              ) : rows.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {t('no_appointment_debts', 'No appointment debts yet.')}
                </p>
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
                        <th className="px-4 py-3 text-right">
                          {t('actions', 'Actions')}
                        </th>
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
                            {money(d.amount, d.currency || EUR)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {d.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex flex-wrap justify-end gap-1">
                              {d.status !== 'paid' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={updateDebt.isPending}
                                  onClick={() => void setStatus(d, 'paid')}
                                >
                                  {t('mark_paid', 'Mark paid')}
                                </Button>
                              ) : null}
                              {d.status !== 'waived' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateDebt.isPending}
                                  onClick={() => void setStatus(d, 'waived')}
                                >
                                  {t('waive', 'Waive')}
                                </Button>
                              ) : null}
                              {d.status !== 'unpaid' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={updateDebt.isPending}
                                  onClick={() => void setStatus(d, 'unpaid')}
                                >
                                  {t('mark_unpaid', 'Unpaid')}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                {t('doctor_appointment_prices', 'Doctor appointment prices')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(
                  'doctor_prices_hint_eur',
                  'Each completed appointment creates an unpaid debt at this euro rate.',
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {prices.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : prices.isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {t('failed_load_prices', 'Failed to load doctor prices.')}
                </p>
              ) : (prices.data?.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t(
                    'no_clinic_doctors',
                    'No doctors assigned to this clinic yet.',
                  )}
                </p>
              ) : (
                prices.data?.map((row) => (
                  <DoctorPriceRow key={row.doctor_id} row={row} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
