'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetUsersByRole } from '@/features/users-list/api/use-get-users-by-role';
import { useAssignPatient } from '../api/use-assign-patient';
import {
  normStatus,
  roleLabel,
} from '../utils/normalizeEnum';

interface AssignCareTeamDialogProps {
  patientId: number;
  patientName?: string;
  /** Which role this assignment is for. */
  role: 'DOCTOR' | 'CAREGIVER';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing member ids already on the team (hidden from the picker). */
  excludeIds?: number[];
  /** Default: add as primary. Uncheck to keep current primary. */
  defaultMakePrimary?: boolean;
}

export function AssignCareTeamDialog({
  patientId,
  patientName,
  role,
  open,
  onOpenChange,
  excludeIds = [],
  defaultMakePrimary = true,
}: AssignCareTeamDialogProps) {
  const [selectedId, setSelectedId] = useState('');
  const [makePrimary, setMakePrimary] = useState(defaultMakePrimary);
  const { data: users, isLoading } = useGetUsersByRole(
    role === 'DOCTOR' ? 'doctor' : 'caregiver',
  );
  const assign = useAssignPatient();

  useEffect(() => {
    if (!open) {
      setSelectedId('');
      setMakePrimary(defaultMakePrimary);
    }
  }, [open, defaultMakePrimary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    assign.mutate(
      {
        patient_id: patientId,
        role_assignment: role,
        assign_user_id: Number(selectedId),
        make_primary: makePrimary,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const excluded = new Set(excludeIds);
  const activeUsers = (users ?? []).filter(
    (u: { id: number; status?: string }) =>
      normStatus(u.status) !== 'INACTIVE' && !excluded.has(u.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {roleLabel(role)}</DialogTitle>
          <DialogDescription>
            Add a {roleLabel(role).toLowerCase()} to
            {patientName ? ` ${patientName}` : ' this patient'}
            &apos;s care team. You can keep multiple members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{roleLabel(role)}</Label>
            <Select
              value={selectedId || undefined}
              onValueChange={setSelectedId}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isLoading ? 'Loading…' : 'Select a user'}
                />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map(
                  (u: {
                    id: number;
                    username: string;
                    first_name?: string;
                    last_name?: string;
                  }) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.first_name || u.last_name
                        ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                        : u.username}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={makePrimary}
              onCheckedChange={(v) => setMakePrimary(v === true)}
            />
            Make primary {roleLabel(role).toLowerCase()}
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !selectedId}>
              {assign.isPending ? 'Adding…' : `Add ${roleLabel(role)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
