'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
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

import {
  useAllBillings,
  useUpdateBilling,
  type ClinicBilling,
  type ClinicBillingRow,
} from '../api/use-clinics';
import { BillingDialog } from './BillingDialog';

const STATUSES: ClinicBilling['status'][] = ['unpaid', 'paid', 'overdue', 'waived'];

export function AdminBillingOverview() {
  const { data, isLoading, error } = useAllBillings();
  const update = useUpdateBilling();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editing, setEditing] = useState<ClinicBillingRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      toast.success(`${row.clinic_name} ${row.year} marked ${status}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Yearly billing across all clinics. Mark paid, edit amounts, or open a clinic to add a year.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total billed"
          value={`$${kpis.totalBilled.toFixed(0)}`}
          sub={`Avg $${kpis.avgInvoice.toFixed(0)} / invoice`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label="Collected"
          value={`$${kpis.totalPaid.toFixed(0)}`}
          sub={`${kpis.paidCount} paid records`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="teal"
        />
        <Stat
          label="Outstanding"
          value={`$${kpis.outstanding.toFixed(0)}`}
          sub={`$${kpis.unpaidAmt.toFixed(0)} unpaid`}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <Stat
          label="Collection rate"
          value={`${kpis.collection}%`}
          sub="Paid / billed"
          icon={<Percent className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label="Overdue"
          value={kpis.overdueCount}
          sub={`$${kpis.overdueAmt.toFixed(0)} overdue`}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={kpis.overdueCount > 0 ? 'rose' : 'slate'}
        />
        <Stat
          label="Unpaid years"
          value={kpis.unpaidCount}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <Stat
          label="Clinics billed"
          value={kpis.clinics}
          sub={`${kpis.years} billing years`}
          icon={<Building2 className="h-4 w-4" />}
          tone="blue"
        />
        <Stat
          label="Waived"
          value={`$${kpis.waivedAmt.toFixed(0)}`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="slate"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <CardTitle>All billing records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clinic / invoice…"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{String(error.message)}</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No billing records. Add billing from a clinic page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Clinic</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3 text-right">Actions</th>
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
                      <td className="px-4 py-3 text-right">
                        {r.currency} {Number(r.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={r.status}
                          onValueChange={(v) => quickStatus(r, v as ClinicBilling['status'])}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">
                                {s}
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
                      <td className="px-4 py-3 text-right">
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
