'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FilePlus,
  Package,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClinics, useAllBillings, useAllAppointmentDebts } from '../api/use-clinics';
import { useAdminOrders, useAdminSubscriptions } from '@/features/orders/api/use-orders';
import { useApplicationsReview } from '@/features/applications/api/use-applications';

function moneyEur(amount: number) {
  try {
    // Fixed locale avoids SSR/client hydration mismatch (React #418).
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `€${amount.toFixed(0)}`;
  }
}

type AttentionItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: 'amber' | 'rose' | 'sky';
};

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

  const nest = useMemo(() => {
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
      shipped: byStatus('shipped') + byStatus('delivered'),
      activeSubs,
      rev,
    };
  }, [ordersQ.data, subsQ.data]);

  const clinics = useMemo(() => {
    const list = clinicsQ.data ?? [];
    const billings = billingsQ.data ?? [];
    const apps = appsQ.data ?? [];
    const totalBilled = billings.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalPaid = billings
      .filter((r) => r.status === 'paid')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const overdue = billings.filter((r) => r.status === 'overdue').length;
    const pendingApps = apps.filter((a) =>
      ['submitted', 'under_review', 'payment_pending', 'payment_submitted'].includes(
        String(a.status),
      ),
    ).length;
    const patients = list.reduce((n, c) => n + Number(c.patient_count || 0), 0);
    const doctors = list.reduce((n, c) => n + Number(c.doctor_count || 0), 0);
    return {
      clinics: list.length,
      activeClinics: list.filter((c) => String(c.status).toUpperCase() === 'ACTIVE').length,
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

  const attention = useMemo(() => {
    const items: AttentionItem[] = [];
    if (nest.pendingPayment > 0) {
      items.push({
        id: 'nest-pay',
        label: t('attention_nest_payments', 'Nest orders awaiting payment'),
        detail: `${nest.pendingPayment}`,
        href: '/dashboard/orders',
        tone: 'amber',
      });
    }
    if (clinics.pendingApps > 0) {
      items.push({
        id: 'apps',
        label: t('attention_pending_apps', 'Clinic applications to review'),
        detail: `${clinics.pendingApps}`,
        href: '/dashboard/applications',
        tone: 'sky',
      });
    }
    if (clinics.overdue > 0) {
      items.push({
        id: 'overdue',
        label: t('attention_overdue', 'Overdue clinic invoices'),
        detail: `${clinics.overdue}`,
        href: '/dashboard/billing?tab=b2b',
        tone: 'rose',
      });
    }
    if (clinics.outstanding > 0) {
      items.push({
        id: 'outstanding',
        label: t('attention_outstanding', 'Clinic outstanding balance'),
        detail: moneyEur(clinics.outstanding),
        href: '/dashboard/billing?tab=b2b',
        tone: 'amber',
      });
    }
    if (debts.open > 0) {
      items.push({
        id: 'debts',
        label: t('attention_debts', 'Open appointment debts'),
        detail: `${debts.open} · ${moneyEur(debts.unpaidAmt)}`,
        href: '/dashboard/billing?tab=debts',
        tone: 'amber',
      });
    }
    return items;
  }, [nest.pendingPayment, clinics, debts, t]);

  const kpiStrip = [
    {
      label: t('insight_sub_revenue', 'Nest plan value'),
      value: moneyEur(nest.rev),
      sub: t('insight_annualized_hint', 'Sum of active plan amounts'),
    },
    {
      label: t('insight_pending_nest_pay', 'Nest awaiting payment'),
      value: nest.pendingPayment,
      sub: `${nest.orders} ${t('orders_total', 'orders total')}`,
    },
    {
      label: t('insight_outstanding', 'Clinic outstanding'),
      value: moneyEur(clinics.outstanding),
      sub: `${clinics.collection}% ${t('collected', 'collected')}`,
    },
    {
      label: t('patients', 'Patients'),
      value: clinics.patients,
      sub: `${clinics.activeClinics} ${t('active_clinics_short', 'active clinics')}`,
    },
    {
      label: t('doctors', 'Doctors'),
      value: clinics.doctors,
      sub: `${clinics.clinics} ${t('clinics_total', 'clinics total')}`,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-8"
      >
        <div className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -start-10 bottom-0 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              {t('platform_overview_eyebrow', 'Platform overview')}
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {t('admin_insights_title', 'Nest & Clinics')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(
                'admin_insights_body',
                'Nest commerce, clinic network, patients, and doctors in one place.',
              )}
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/billing">
              {t('open_billing', 'Open billing')}
              <ArrowRight className="ms-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border bg-muted/40"
              />
            ))
          : kpiStrip.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1.5 text-2xl font-black tabular-nums tracking-tight">
                  {kpi.value}
                </p>
                {kpi.sub ? (
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                ) : null}
              </div>
            ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <Package className="h-3.5 w-3.5" />
                {t('nest', 'Nest')}
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {t('nest_rail_title', 'Home monitoring commerce')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'nest_rail_body',
                  'Orders, fulfillment, and Nest subscription plans.',
                )}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 rounded-full">
              <Link href="/dashboard/orders">
                {t('orders', 'Orders')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="h-36 animate-pulse rounded-2xl bg-muted/40" />
          ) : (
            <>
              <Pipeline
                steps={[
                  {
                    label: t('pending_payment', 'Pending'),
                    value: nest.pendingPayment,
                  },
                  { label: t('paid_pipeline_short', 'Paid+'), value: nest.paid },
                  {
                    label: t('activated', 'Activated'),
                    value: nest.activated,
                  },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label={t('insight_active_subs', 'Active subscriptions')}
                  value={nest.activeSubs}
                />
                <Metric
                  icon={<Wallet className="h-4 w-4" />}
                  label={t('insight_sub_revenue', 'Active plan value')}
                  value={moneyEur(nest.rev)}
                />
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit rounded-full">
                <Link href="/dashboard/billing?tab=b2c">
                  {t('nest_subscriptions', 'Nest subscriptions')}
                  <ArrowRight className="ms-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                <Building2 className="h-3.5 w-3.5" />
                {t('clinics', 'Clinics')}
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {t('clinics_rail_title', 'Care network')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'clinics_rail_body',
                  'Clinics, patients, doctors, and enrollment applications.',
                )}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 rounded-full">
              <Link href="/dashboard/clinics">
                {t('clinics', 'Clinics')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="h-36 animate-pulse rounded-2xl bg-muted/40" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric
                  icon={<Building2 className="h-4 w-4" />}
                  label={t('insight_clinics', 'Clinics')}
                  value={`${clinics.activeClinics}/${clinics.clinics}`}
                  sub={t('active_of_total', 'active')}
                />
                <Metric
                  icon={<Users className="h-4 w-4" />}
                  label={t('patients', 'Patients')}
                  value={clinics.patients}
                />
                <Metric
                  icon={<Stethoscope className="h-4 w-4" />}
                  label={t('doctors', 'Doctors')}
                  value={clinics.doctors}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  icon={<FilePlus className="h-4 w-4" />}
                  label={t('insight_pending_apps', 'Pending applications')}
                  value={clinics.pendingApps}
                  emphasize={clinics.pendingApps > 0}
                />
                <Metric
                  icon={<Wallet className="h-4 w-4" />}
                  label={t('insight_clinic_collection', 'Clinic collection')}
                  value={`${clinics.collection}%`}
                  sub={`${moneyEur(clinics.totalPaid)} / ${moneyEur(clinics.totalBilled)}`}
                />
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit rounded-full">
                <Link href="/dashboard/applications">
                  {t('applications', 'Applications')}
                  <ArrowRight className="ms-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </motion.div>
      </section>

      <section className="rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {t('needs_attention', 'Needs attention')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'needs_attention_body',
                'Payments, applications, and invoices that need a decision.',
              )}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : attention.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            <p className="text-sm font-semibold">
              {t('attention_clear', 'All quiet — nothing urgent right now.')}
            </p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      item.tone === 'rose' && 'bg-rose-500/10 text-rose-600',
                      item.tone === 'amber' && 'bg-amber-500/10 text-amber-700',
                      item.tone === 'sky' && 'bg-sky-500/10 text-sky-700',
                    )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.label}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {item.detail}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Shortcut
          href="/dashboard/orders"
          title={t('quick_nest_orders', 'Nest orders')}
          body={t(
            'quick_nest_orders_body',
            'Mark Nest orders paid, ship, and activate.',
          )}
          icon={<Package className="h-5 w-5" />}
        />
        <Shortcut
          href="/dashboard/clinics"
          title={t('clinics', 'Clinics')}
          body={t('quick_clinics_body', 'Browse clinics, patients, and doctors.')}
          icon={<Building2 className="h-5 w-5" />}
        />
        <Shortcut
          href="/dashboard/applications"
          title={t('applications', 'Applications')}
          body={t(
            'quick_apps_body',
            'Review clinic enrollments and payment receipts.',
          )}
          icon={<FilePlus className="h-5 w-5" />}
        />
        <Shortcut
          href="/dashboard/billing"
          title={t('billing', 'Billing')}
          body={t(
            'quick_billing_body',
            'Nest plans, clinic invoices, and appointment debts.',
          )}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <Shortcut
          href="/dashboard/support-tickets"
          title={t('support_tickets', 'Support tickets')}
          body={t('quick_support_body', 'Answer caregiver and Nest support tickets.')}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </section>
    </div>
  );
}

function Pipeline({
  steps,
}: {
  steps: { label: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className="relative rounded-2xl border bg-muted/25 px-3 py-3 text-center"
        >
          {index < steps.length - 1 ? (
            <span className="pointer-events-none absolute -end-1.5 top-1/2 z-10 hidden h-px w-3 -translate-y-1/2 bg-border sm:block" />
          ) : null}
          <p className="text-xl font-black tabular-nums">{step.value}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  emphasize,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-3',
        emphasize ? 'border-amber-500/30 bg-amber-500/5' : 'bg-muted/20',
      )}
    >
      <div className="mb-2 text-muted-foreground">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Shortcut({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md transition hover:border-primary/25 hover:bg-muted/30 dark:border-zinc-800/80 dark:bg-zinc-900/60"
    >
      <span className="text-muted-foreground transition group-hover:text-primary">
        {icon}
      </span>
      <p className="text-sm font-semibold group-hover:text-primary">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </Link>
  );
}
