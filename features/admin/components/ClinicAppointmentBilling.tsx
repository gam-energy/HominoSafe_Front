'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
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

function DoctorPriceRow({ row }: { row: DoctorAppointmentPrice }) {
  const { t } = useTranslation();
  const upsert = useUpsertMyDoctorPrice();
  const [amount, setAmount] = useState(String(row.amount ?? 0));
  const [currency, setCurrency] = useState(row.currency || 'USD');
  const [active, setActive] = useState(Boolean(row.is_active));

  const dirty =
    Number(amount) !== Number(row.amount) ||
    currency !== (row.currency || 'USD') ||
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
        currency,
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
        <Input
          type="number"
          min={0}
          step="0.01"
          className="w-28"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="IRR">IRR</SelectItem>
          </SelectContent>
        </Select>
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

function DebtRow({ debt }: { debt: AppointmentDebt }) {
  const { t } = useTranslation();
  const update = useUpdateMyAppointmentDebt();

  const setStatus = async (status: AppointmentDebt['status']) => {
    try {
      await update.mutateAsync({ debtId: debt.id, status });
      toast.success(t('debt_updated', 'Debt updated'));
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('update_failed', 'Update failed'));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{debt.patient_name || `#${debt.patient_id}`}</p>
          <Badge variant="outline" className="text-xs">
            {debt.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('doctor', 'Doctor')}: {debt.doctor_name} ·{' '}
          {formatWhen(debt.scheduled_at || debt.charged_at)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-semibold tabular-nums">
          {money(debt.amount, debt.currency)}
        </p>
        {debt.status !== 'paid' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={update.isPending}
            onClick={() => void setStatus('paid')}
          >
            <CheckCircle2 className="me-1 h-3.5 w-3.5" />
            {t('mark_paid', 'Mark paid')}
          </Button>
        ) : null}
        {debt.status !== 'waived' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={update.isPending}
            onClick={() => void setStatus('waived')}
          >
            {t('waive', 'Waive')}
          </Button>
        ) : null}
        {debt.status !== 'unpaid' ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={update.isPending}
            onClick={() => void setStatus('unpaid')}
          >
            {t('mark_unpaid', 'Unpaid')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ClinicAppointmentBilling() {
  const { t } = useTranslation();
  const [debtFilter, setDebtFilter] = useState('all');
  const prices = useMyDoctorPrices();
  const summary = useMyAppointmentDebtSummary();
  const debts = useMyAppointmentDebts(
    debtFilter === 'all' ? undefined : debtFilter,
  );

  const kpis = useMemo(() => {
    const s = summary.data;
    return [
      {
        label: t('appointment_debt_unpaid', 'Unpaid appointment debt'),
        value: money(s?.unpaid || 0),
        icon: Wallet,
      },
      {
        label: t('appointment_debt_paid', 'Paid'),
        value: money(s?.paid || 0),
        icon: CheckCircle2,
      },
      {
        label: t('open_debts', 'Open debts'),
        value: String(s?.unpaid_count || 0),
        icon: CreditCard,
      },
    ];
  }, [summary.data, t]);

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title={t('clinic_billing', 'Clinic billing')}
          description={t(
            'clinic_billing_desc',
            'Set each doctor’s appointment price and track visit debts after completed appointments.',
          )}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="debts">
          <TabsList>
            <TabsTrigger value="debts">
              {t('appointment_debts', 'Appointment debts')}
            </TabsTrigger>
            <TabsTrigger value="prices">
              {t('doctor_pricing', 'Doctor pricing')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debts" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t(
                  'appointment_debts_hint',
                  'Created automatically when a visit is completed with a report.',
                )}
              </p>
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
            </div>

            {debts.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : debts.isError ? (
              <Card className="border-destructive/40">
                <CardContent className="py-10 text-center text-sm text-destructive">
                  {t(
                    'failed_load_debts',
                    'Failed to load appointment debts. Check your clinic admin access.',
                  )}
                </CardContent>
              </Card>
            ) : (debts.data?.length ?? 0) === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  {t('no_appointment_debts', 'No appointment debts yet.')}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {debts.data?.map((d) => (
                  <DebtRow key={d.id} debt={d} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prices" className="mt-4 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  {t('doctor_appointment_prices', 'Doctor appointment prices')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'doctor_prices_hint',
                    'Each completed appointment for that doctor creates an unpaid debt at this rate.',
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
    </PageContainer>
  );
}
