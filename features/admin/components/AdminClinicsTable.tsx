'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Percent,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useClinics, useDeleteClinic, type Clinic } from '../api/use-clinics';
import { ClinicDialog } from './ClinicDialog';

export function AdminClinicsTable() {
  const { data, isLoading, error, isFetching } = useClinics();
  const del = useDeleteClinic();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [confirmDel, setConfirmDel] = useState<Clinic | null>(null);

  const onEdit = (c: Clinic) => {
    setEditing(c);
    setDialogOpen(true);
  };
  const onCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!confirmDel) return;
    try {
      await del.mutateAsync(confirmDel.id);
      toast.success('Clinic deleted');
      setConfirmDel(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete clinic');
    }
  };

  const kpis = useMemo(() => {
    const list = data ?? [];
    const active = list.filter((c) => String(c.status).toUpperCase() === 'ACTIVE').length;
    const totalDoctors = list.reduce((s, c) => s + (c.doctor_count || 0), 0);
    const totalPatients = list.reduce((s, c) => s + (c.patient_count || 0), 0);
    const totalCaregivers = list.reduce((s, c) => s + (c.caregiver_count || 0), 0);
    const totalBilled = list.reduce((s, c) => s + (c.billing_total || 0), 0);
    const totalPaid = list.reduce((s, c) => s + (c.billing_paid || 0), 0);
    const totalOutstanding = list.reduce((s, c) => s + (c.billing_outstanding || 0), 0);
    const overdue = list.reduce((s, c) => s + (c.overdue_count || 0), 0);
    const unpaid = list.reduce((s, c) => s + (c.unpaid_count || 0), 0);
    const collection =
      totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0;
    const avgPatientsPerDoctor =
      totalDoctors > 0 ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0;
    return {
      clinics: list.length,
      active,
      inactive: list.length - active,
      totalDoctors,
      totalPatients,
      totalCaregivers,
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdue,
      unpaid,
      collection,
      avgPatientsPerDoctor,
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Clinics</h1>
          <p className="text-sm text-muted-foreground">
            Manage clinics, assign doctors and patients, and review yearly billing.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" /> New clinic
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clinics"
          value={kpis.clinics}
          sub={`${kpis.active} active · ${kpis.inactive} inactive`}
          icon={<Building2 className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label="Doctors"
          value={kpis.totalDoctors}
          sub={`${kpis.avgPatientsPerDoctor} patients / doctor`}
          icon={<Stethoscope className="h-4 w-4" />}
          tone="teal"
        />
        <StatCard
          label="Patients"
          value={kpis.totalPatients}
          sub={`${kpis.totalCaregivers} caregivers`}
          icon={<UserRound className="h-4 w-4" />}
          tone="indigo"
        />
        <StatCard
          label="Members"
          value={kpis.totalDoctors + kpis.totalPatients + kpis.totalCaregivers}
          sub="Across all clinics"
          icon={<Users className="h-4 w-4" />}
          tone="slate"
        />
        <StatCard
          label="Billed"
          value={`$${kpis.totalBilled.toFixed(0)}`}
          sub={`$${kpis.totalPaid.toFixed(0)} collected`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Outstanding"
          value={`$${kpis.totalOutstanding.toFixed(0)}`}
          sub={`${kpis.unpaid} unpaid years`}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label="Collection rate"
          value={`${kpis.collection}%`}
          sub="Paid / billed"
          icon={<Percent className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Overdue"
          value={kpis.overdue}
          sub="Billing records past due"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={kpis.overdue > 0 ? 'rose' : 'slate'}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            All clinics
          </CardTitle>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading clinics…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{String(error.message)}</div>
          ) : !data || data.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No clinics yet. Create one to assign doctors and patients.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Clinic</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Doctors</th>
                    <th className="px-4 py-3 text-center">Patients</th>
                    <th className="px-4 py-3 text-center">Caregivers</th>
                    <th className="px-4 py-3 text-right">Collection</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3">Latest year</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/clinics/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {c.code}
                          {c.email ? ` · ${c.email}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            String(c.status).toUpperCase() === 'ACTIVE' ? 'default' : 'secondary'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{c.doctor_count}</td>
                      <td className="px-4 py-3 text-center">{c.patient_count}</td>
                      <td className="px-4 py-3 text-center">{c.caregiver_count ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          {(c.collection_rate ?? 0) >= 80 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : null}
                          {c.collection_rate ?? 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            c.billing_outstanding > 0
                              ? 'font-medium text-amber-600'
                              : 'text-muted-foreground'
                          }
                        >
                          ${(c.billing_outstanding || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.latest_billing_year ? (
                          <span className="capitalize">
                            {c.latest_billing_year}
                            {c.latest_billing_status ? ` · ${c.latest_billing_status}` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDel(c)}
                            disabled={(c.member_count ?? c.doctor_count + c.patient_count) > 0}
                            title={
                              (c.member_count ?? 0) > 0
                                ? 'Remove members first'
                                : 'Delete clinic'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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

      <ClinicDialog open={dialogOpen} onOpenChange={setDialogOpen} clinic={editing} />

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete clinic</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{confirmDel?.name}&quot; and its billing records.
              Members will be unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={del.isPending}>
              {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TONE: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

function StatCard({
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
  tone?: keyof typeof TONE;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          {icon && (
            <span className={`inline-flex rounded-md p-1.5 ${TONE[tone]}`}>{icon}</span>
          )}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
