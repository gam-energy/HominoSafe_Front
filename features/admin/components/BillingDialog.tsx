'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateBilling,
  useUpdateBilling,
  type BillingPayload,
  type BillingUpdatePayload,
  type ClinicBilling,
} from '../api/use-clinics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: number;
  billing?: ClinicBilling | null;
  defaultYear?: number;
}

const STATUSES: ClinicBilling['status'][] = ['unpaid', 'paid', 'overdue', 'waived'];

export function BillingDialog({ open, onOpenChange, clinicId, billing, defaultYear }: Props) {
  const isEdit = !!billing;
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<BillingPayload>({
    year: defaultYear ?? currentYear,
    amount: 0,
    currency: 'USD',
    status: 'unpaid',
    due_date: null,
    invoice_number: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      if (billing) {
        setForm({
          year: billing.year,
          amount: billing.amount,
          currency: billing.currency,
          status: billing.status,
          due_date: billing.due_date ?? null,
          invoice_number: billing.invoice_number ?? '',
          notes: billing.notes ?? '',
        });
      } else {
        setForm({
          year: defaultYear ?? currentYear,
          amount: 0,
          currency: 'USD',
          status: 'unpaid',
          due_date: null,
          invoice_number: '',
          notes: '',
        });
      }
    }
  }, [open, billing, defaultYear, currentYear]);

  const createM = useCreateBilling(clinicId);
  const updateM = useUpdateBilling();
  const pending = createM.isPending || updateM.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && billing) {
        const payload: BillingUpdatePayload = {
          amount: Number(form.amount),
          currency: form.currency,
          status: form.status,
          due_date: form.due_date || null,
          invoice_number: form.invoice_number || null,
          notes: form.notes || null,
        };
        await updateM.mutateAsync({ billingId: billing.id, payload });
        toast.success('Billing updated');
      } else {
        await createM.mutateAsync({
          ...form,
          amount: Number(form.amount),
        });
        toast.success('Billing record created');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save billing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${billing?.year} billing` : 'New yearly billing'}</DialogTitle>
          <DialogDescription>
            One billing record per clinic per year. Marking as paid records the payment timestamp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-year">Year *</Label>
              <Input
                id="b-year"
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                disabled={isEdit}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-amount">Amount *</Label>
              <Input
                id="b-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-currency">Currency</Label>
              <Input
                id="b-currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ClinicBilling['status'] })}
              >
                <SelectTrigger id="b-status" className="w-full">
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
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-due">Due date</Label>
              <Input
                id="b-due"
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value || null })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-invoice">Invoice #</Label>
              <Input
                id="b-invoice"
                value={form.invoice_number ?? ''}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="b-notes">Notes</Label>
              <Textarea
                id="b-notes"
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
