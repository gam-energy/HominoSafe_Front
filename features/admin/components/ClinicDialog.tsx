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
  useCreateClinic,
  useUpdateClinic,
  type Clinic,
  type ClinicPayload,
  type ClinicStatus,
} from '../api/use-clinics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: Clinic | null;
}

const EMPTY: ClinicPayload = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  contact_person: '',
  status: 'ACTIVE',
  notes: '',
};

export function ClinicDialog({ open, onOpenChange, clinic }: Props) {
  const isEdit = !!clinic;
  const [form, setForm] = useState<ClinicPayload>(EMPTY);

  useEffect(() => {
    if (open) {
      if (clinic) {
        setForm({
          name: clinic.name ?? '',
          code: clinic.code ?? '',
          address: clinic.address ?? '',
          phone: clinic.phone ?? '',
          email: clinic.email ?? '',
          contact_person: clinic.contact_person ?? '',
          status: clinic.status ?? 'ACTIVE',
          notes: clinic.notes ?? '',
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, clinic]);

  const createM = useCreateClinic();
  const updateM = useUpdateClinic(clinic?.id ?? 0);

  const pending = createM.isPending || updateM.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      const payload: ClinicPayload = {
        ...form,
        code: form.code.trim(),
      };
      if (isEdit && clinic) {
        await updateM.mutateAsync(payload);
        toast.success('Clinic updated');
      } else {
        await createM.mutateAsync(payload);
        toast.success('Clinic created');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save clinic');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit clinic' : 'New clinic'}</DialogTitle>
          <DialogDescription>
            Admins manage clinics, their doctors and patients, and yearly billing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="clinic-name">Name *</Label>
              <Input
                id="clinic-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clinic-code">Code</Label>
              <Input
                id="clinic-code"
                value={form.code}
                placeholder="auto-generated"
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clinic-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: ClinicStatus) => setForm({ ...form, status: v })}
              >
                <SelectTrigger id="clinic-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clinic-phone">Phone</Label>
              <Input
                id="clinic-phone"
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clinic-email">Email</Label>
              <Input
                id="clinic-email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="clinic-contact">Contact person</Label>
              <Input
                id="clinic-contact"
                value={form.contact_person ?? ''}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="clinic-address">Address</Label>
              <Input
                id="clinic-address"
                value={form.address ?? ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="clinic-notes">Notes</Label>
              <Textarea
                id="clinic-notes"
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create clinic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
