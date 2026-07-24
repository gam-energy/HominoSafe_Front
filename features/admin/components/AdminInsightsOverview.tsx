'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FilePlus,
  Loader2,
  Package,
  Percent,
  Users,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinics, useAllBillings, useAllAppointmentDebts } from '../api/use-clinics';
import { useAdminOrders, useAdminSubscriptions } from '@/features/orders/api/use-orders';
import { useApplicationsReview } from '@/features/applications/api/use-applications';

function moneyEur(amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `€${amount.toFixed(0)}`;
  }
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate' | 'teal';
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
    slate: 'bg-muted text-muted-foreground',
  };
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`rounded-xl p-2 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminInsightsOverview() {
  const { t } = useTranslation();
  const clinicsQ = useClinics();
  const ordersQ = useAdminOrders();
  const subsQ = useAdminSubscriptions();
  const billingsQ = useAllBillings();
  const debtsQ = useAllAppointmentDebts();
  const appsQ = useApplicationsReview();

  const loading =
    clinicsQ.isLoading ||
    ordersQ.isLoading ||
    subsQ.isLoading ||
    billingsQ.isLoading ||
    debtsQ.isLoading ||
    appsQ.isLoading;

  const b2c = useMemo(() => {
    const orders = ordersQ.data ?? [];
    const subs = subsQ.data ?? [];
    const byStatus = (s: string) => orders.filter((o) => o.status === s).length;
    const activeSubs = subs.filter((s) => s.status === 'active').length;
    const rev = subs
      .filter((s) => s.status === 'active')
      .reduce((n, s) => n + Number(s.amount || 0), 0);
    return {
      orders: orders.length,
      pendingPayment: byStatus('pending_payment'),
      paid: byStatus('paid') + byStatus('shipped') + byStatus('delivered') + byStatus('activated'),
      activated: byStatus('activated'),
      activeSubs,
      rev,
    };
  }, [ordersQ.data, subsQ.data]);

  const b2b = useMemo(() => {
    const clinics = clinicsQ.data ?? [];
    const billings = billingsQ.data ?? [];
    const apps = appsQ.data ?? [];
    const totalBilled = billings.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalPaid = billings
      .filter((r) => r.status === 'paid')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const overdue = billings.filter((r) => r.status === 'overdue').length;
    const pendingApps = apps.filter((a) =>
      ['submitted', 'under_review', 'payment_pending', 'payment_submitted'].includes(
        String(a.status)
      )
    ).length;
    const patients = clinics.reduce((n, c) => n + Number(c.patient_count || 0), 0);
    const doctors = clinics.reduce((n, c) => n + Number(c.doctor_count || 0), 0);
    return {
      clinics: clinics.length,
      activeClinics: clinics.filter((c) => String(c.status).toUpperCase() === 'ACTIVE').length,
      patients,
      doctors,
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      collection: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0,
      overdue,
      pendingApps,
      apps: apps.length,
    };
  }, [clinicsQ.data, billingsQ.data, appsQ.data]);

  const debts = useMemo(() => {
    const rows = debtsQ.data ?? [];
    const unpaid = rows.filter((d) => d.status === 'unpaid');
    const unpaidAmt = unpaid.reduce((s, d) => s + Number(d.amount || 0), 0);
    return { total: rows.length, open: unpaid.length, unpaidAmt };
  }, [debtsQ.data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin_insights_title', 'Admin insights')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'admin_insights_body',
              'B2C Nest commerce, B2B clinic operations, and billing in one view.'
            )}
          </p>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading…')}
          </span>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('nav_b2c', 'B2C')}</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/orders">
              {t('orders', 'Orders')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t('insight_nest_orders', 'Nest orders')}
            value={b2c.orders}
            sub={`${b2c.pendingPayment} pending payment`}
            icon={<Package className="h-4 w-4" />}
            tone="blue"
          />
          <Stat
            label={t('insight_paid_pipeline', 'Paid pipeline')}
            value={b2c.paid}
            sub={`${b2c.activated} activated`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="emerald"
          />
          <Stat
            label={t('insight_active_subs', 'Active subscriptions')}
            value={b2c.activeSubs}
            icon={<BadgeCreditIcon />}
            tone="teal"
          />
          <Stat
            label={t('insight_sub_revenue', 'Active plan value')}
            value={moneyEur(b2c.rev)}
            sub={t('insight_annualized_hint', 'Sum of active plan amounts')}
            icon={<Wallet className="h-4 w-4" />}
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('nav_b2b', 'B2B')}</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/clinics">
              {t('clinics', 'Clinics')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t('insight_clinics', 'Clinics')}
            value={b2b.clinics}
            sub={`${b2b.activeClinics} active`}
            icon={<Building2 className="h-4 w-4" />}
            tone="blue"
          />
          <Stat
            label={t('insight_network', 'Network size')}
            value={b2b.patients + b2b.doctors}
            sub={`${b2b.patients} patients · ${b2b.doctors} doctors`}
            icon={<Users className="h-4 w-4" />}
            tone="slate"
          />
          <Stat
            label={t('insight_pending_apps', 'Pending applications')}
            value={b2b.pendingApps}
            sub={`${b2b.apps} total`}
            icon={<FilePlus className="h-4 w-4" />}
            tone={b2b.pendingApps > 0 ? 'amber' : 'slate'}
          />
          <Stat
            label={t('insight_clinic_collection', 'Clinic collection')}
            value={`${b2b.collection}%`}
            sub={`${moneyEur(b2b.totalPaid)} / ${moneyEur(b2b.totalBilled)}`}
            icon={<Percent className="h-4 w-4" />}
            tone="emerald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('billing', 'Billing')}</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/billing">
              {t('open_billing', 'Open billing')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t('insight_outstanding', 'Clinic outstanding')}
            value={moneyEur(b2b.outstanding)}
            icon={<Wallet className="h-4 w-4" />}
            tone="amber"
          />
          <Stat
            label={t('insight_overdue', 'Overdue invoices')}
            value={b2b.overdue}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={b2b.overdue > 0 ? 'rose' : 'slate'}
          />
          <Stat
            label={t('insight_open_debts', 'Open appointment debts')}
            value={debts.open}
            sub={moneyEur(debts.unpaidAmt)}
            icon={<CreditCard className="h-4 w-4" />}
            tone={debts.open > 0 ? 'amber' : 'slate'}
          />
          <Stat
            label={t('insight_debt_records', 'Debt records')}
            value={debts.total}
            icon={<CreditCard className="h-4 w-4" />}
            tone="slate"
          />
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <QuickLink
          href="/dashboard/orders"
          title={t('quick_b2c_orders', 'B2C orders')}
          body={t('quick_b2c_orders_body', 'Mark Nest orders paid, ship, and activate.')}
          icon={<Package className="h-5 w-5 text-primary" />}
        />
        <QuickLink
          href="/dashboard/applications"
          title={t('quick_b2b_apps', 'B2B applications')}
          body={t('quick_b2b_apps_body', 'Review clinic enrollments and payment receipts.')}
          icon={<FilePlus className="h-5 w-5 text-primary" />}
        />
        <QuickLink
          href="/dashboard/billing"
          title={t('quick_billing', 'Unified billing')}
          body={t(
            'quick_billing_body',
            'Subscriptions, clinic yearly invoices, and appointment debts.'
          )}
          icon={<CreditCard className="h-5 w-5 text-primary" />}
        />
      </div>
    </div>
  );
}

function BadgeCreditIcon() {
  return <CreditCard className="h-4 w-4" />;
}

function QuickLink({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <p className="font-semibold group-hover:text-primary">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </Link>
  );
}
