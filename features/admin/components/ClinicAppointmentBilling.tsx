'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Loader2,
  Stethoscope,
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t('clinic_billing', 'Clinic billing')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            'clinic_billing_desc',
            'Set each doctor’s appointment price and track visit debts after completed appointments.',
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">
              {t('appointment_debt_unpaid', 'Unpaid appointment debt')}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {money(summary.data?.unpaid || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">
              {t('appointment_debt_paid', 'Paid')}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {money(summary.data?.paid || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">
              {t('open_debts', 'Open debts')}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {summary.data?.unpaid_count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">
              {t('total_debt', 'Total debt')}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {money(summary.data?.total_debt || 0)}
            </div>
          </CardContent>
        </Card>
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

        <TabsContent value="debts" className="mt-4">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between space-y-0 gap-3">
              <div>
                <CardTitle>
                  {t('appointment_debts', 'Appointment debts')}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    'appointment_debts_hint',
                    'Created automatically when a visit is completed with a report.',
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
              ) : (debts.data?.length ?? 0) === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {t('no_appointment_debts', 'No appointment debts yet.')}
                </p>
              ) : (
                <div className="flex flex-col gap-2 p-4">
                  {debts.data?.map((d) => (
                    <DebtRow key={d.id} debt={d} />
                  ))}
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
  );
}
