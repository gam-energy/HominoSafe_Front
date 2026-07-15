'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Pencil,
  Percent,
  Phone,
  Plus,
  Stethoscope,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  useClinic,
  useClinicMembers,
  useClinicBillings,
  useRemoveClinicMember,
  useDeleteBilling,
  type ClinicBilling,
} from '../api/use-clinics';
import { ClinicDialog } from './ClinicDialog';
import { BillingDialog } from './BillingDialog';
import { AssignClinicMemberDialog } from './AssignClinicMemberDialog';

export function ClinicDetail({ clinicId }: { clinicId: number }) {
  const { data: clinic, isLoading } = useClinic(clinicId);
  const doctors = useClinicMembers(clinicId, 'DOCTOR');
  const patients = useClinicMembers(clinicId, 'PATIENT');
  const caregivers = useClinicMembers(clinicId, 'CAREGIVER');
  const billings = useClinicBillings(clinicId);

  const removeMember = useRemoveClinicMember(clinicId);
  const deleteBilling = useDeleteBilling();

  const [editOpen, setEditOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<ClinicBilling | null>(null);
  const [assignRole, setAssignRole] = useState<'DOCTOR' | 'PATIENT' | 'CAREGIVER' | null>(null);

  if (isLoading || !clinic) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading clinic…
      </div>
    );
  }

  const onRemoveMember = async (userId: number, name: string) => {
    try {
      await removeMember.mutateAsync(userId);
      toast.success(`${name} removed from clinic`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to remove');
    }
  };

  const onDeleteBilling = async (b: ClinicBilling) => {
    try {
      await deleteBilling.mutateAsync(b.id);
      toast.success('Billing record deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete billing');
    }
  };

  const totalBilled = (billings.data ?? []).reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalPaid = (billings.data ?? [])
    .filter((b) => b.status === 'paid')
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const unpaidYears = (billings.data ?? []).filter((b) => b.status === 'unpaid').length;
  const overdueYears = (billings.data ?? []).filter((b) => b.status === 'overdue').length;
  const collection = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0;
  const patientsPerDoctor =
    clinic.doctor_count > 0
      ? Math.round((clinic.patient_count / clinic.doctor_count) * 10) / 10
      : 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/clinics">
              <ArrowLeft className="h-4 w-4" /> Clinics
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{clinic.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{clinic.code}</span>
              <Badge variant={clinic.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {clinic.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Doctors"
          value={clinic.doctor_count}
          sub={`${patientsPerDoctor} patients / doctor`}
          icon={<Stethoscope className="h-4 w-4" />}
          tone="teal"
        />
        <Stat
          label="Patients"
          value={clinic.patient_count}
          sub={`${clinic.caregiver_count ?? caregivers.data?.length ?? 0} caregivers`}
          icon={<UserRound className="h-4 w-4" />}
          tone="indigo"
        />
        <Stat
          label="Members"
          value={
            clinic.member_count ??
            clinic.doctor_count +
              clinic.patient_count +
              (clinic.caregiver_count ?? caregivers.data?.length ?? 0)
          }
          icon={<Users className="h-4 w-4" />}
          tone="slate"
        />
        <Stat
          label="Collection rate"
          value={`${clinic.collection_rate ?? collection}%`}
          sub={
            collection >= 80 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Healthy
              </span>
            ) : (
              'Paid / billed'
            )
          }
          icon={<Percent className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label="Total billed"
          value={`$${totalBilled.toFixed(2)}`}
          sub={`$${totalPaid.toFixed(2)} paid`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
        />
        <Stat
          label="Outstanding"
          value={`$${outstanding.toFixed(2)}`}
          sub={`${unpaidYears} unpaid years`}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <Stat
          label="Overdue"
          value={overdueYears}
          sub="Billing years past due"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={overdueYears > 0 ? 'rose' : 'slate'}
        />
        <Stat
          label="Latest billing"
          value={clinic.latest_billing_year ?? '—'}
          sub={
            clinic.latest_billing_status ? (
              <span className="capitalize">{clinic.latest_billing_status}</span>
            ) : (
              'No records yet'
            )
          }
          icon={<CreditCard className="h-4 w-4" />}
          tone="blue"
        />
      </div>

      {(clinic.address || clinic.phone || clinic.email) && (
        <Card>
          <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-3">
            <Field label="Address" value={clinic.address} />
            <Field label="Phone" value={clinic.phone} icon={<Phone className="h-3 w-3" />} />
            <Field label="Email" value={clinic.email} icon={<Mail className="h-3 w-3" />} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="caregivers">Caregivers</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors">
          <MemberCard
            title="Doctors"
            role="DOCTOR"
            members={doctors.data ?? []}
            loading={doctors.isLoading}
            onAdd={() => setAssignRole('DOCTOR')}
            onRemove={onRemoveMember}
            removing={removeMember.isPending}
          />
        </TabsContent>

        <TabsContent value="patients">
          <MemberCard
            title="Patients"
            role="PATIENT"
            members={patients.data ?? []}
            loading={patients.isLoading}
            onAdd={() => setAssignRole('PATIENT')}
            onRemove={onRemoveMember}
            removing={removeMember.isPending}
          />
        </TabsContent>

        <TabsContent value="caregivers">
          <MemberCard
            title="Caregivers"
            role="CAREGIVER"
            members={caregivers.data ?? []}
            loading={caregivers.isLoading}
            onAdd={() => setAssignRole('CAREGIVER')}
            onRemove={onRemoveMember}
            removing={removeMember.isPending}
          />
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Yearly billing</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingBilling(null);
                  setBillingOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add year
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {billings.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
                </div>
              ) : (billings.data ?? []).length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No billing records yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Paid at</th>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(billings.data ?? []).map((b) => (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{b.year}</td>
                          <td className="px-4 py-3 text-right">
                            {b.currency} {Number(b.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <BillingBadge status={b.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {b.due_date ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {b.paid_at ? new Date(b.paid_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {b.invoice_number ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingBilling(b);
                                  setBillingOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteBilling(b)}
                                disabled={deleteBilling.isPending}
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
        </TabsContent>
      </Tabs>

      <ClinicDialog open={editOpen} onOpenChange={setEditOpen} clinic={clinic} />
      {assignRole && (
        <AssignClinicMemberDialog
          open={!!assignRole}
          onOpenChange={(o) => !o && setAssignRole(null)}
          clinicId={clinicId}
          clinicName={clinic.name}
          role={assignRole}
          excludeIds={
            (
              assignRole === 'DOCTOR'
                ? doctors.data
                : assignRole === 'CAREGIVER'
                  ? caregivers.data
                  : patients.data
            )?.map((m) => m.id) ?? []
          }
        />
      )}
      <BillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        clinicId={clinicId}
        billing={editingBilling}
      />
    </div>
  );
}

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
  sub?: React.ReactNode;
  tone?: 'blue' | 'teal' | 'indigo' | 'slate' | 'emerald' | 'amber' | 'rose';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          {icon && <span className={`inline-flex rounded-md p-1.5 ${tones[tone]}`}>{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm">
        {icon}
        {value || '—'}
      </span>
    </div>
  );
}

function BillingBadge({ status }: { status: ClinicBilling['status'] }) {
  const map: Record<ClinicBilling['status'], string> = {
    paid: 'default',
    unpaid: 'secondary',
    overdue: 'destructive',
    waived: 'outline',
  };
  return (
    <Badge variant={map[status] as any} className="capitalize">
      {status}
    </Badge>
  );
}

function MemberCard({
  title,
  role,
  members,
  loading,
  onAdd,
  onRemove,
  removing,
}: {
  title: string;
  role: 'DOCTOR' | 'PATIENT' | 'CAREGIVER';
  members: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone_number?: string | null;
    role: string;
    status?: string | null;
  }[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (id: number, name: string) => void;
  removing: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={onAdd}>
          <UserPlus className="h-4 w-4" /> Add {role.toLowerCase()}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} assigned to this clinic yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const full = [m.first_name, m.last_name].filter(Boolean).join(' ');
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/users/${m.id}`}
                          className="font-medium hover:underline"
                        >
                          {full || m.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">@{m.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone_number || '—'}</td>
                      <td className="px-4 py-3">
                        {m.status && (
                          <Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {m.status}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removing}
                          onClick={() => onRemove(m.id, full || m.username)}
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
