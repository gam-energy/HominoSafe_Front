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
}

export function AssignCareTeamDialog({
  patientId,
  patientName,
  role,
  open,
  onOpenChange,
}: AssignCareTeamDialogProps) {
  // Existing users-list hook only types role as "caregiver" | "doctor" — pass
  // the lowercase form it expects.
  const [selectedId, setSelectedId] = useState('');
  const { data: users, isLoading } = useGetUsersByRole(
    role === 'DOCTOR' ? 'doctor' : 'caregiver',
  );
  const assign = useAssignPatient();

  useEffect(() => {
    if (!open) setSelectedId('');
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    assign.mutate(
      {
        patient_id: patientId,
        role_assignment: role,
        assign_user_id: Number(selectedId),
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const activeUsers = (users ?? []).filter(
    (u: { status?: string }) => normStatus(u.status) !== 'INACTIVE',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {roleLabel(role)}</DialogTitle>
          <DialogDescription>
            Choose a {roleLabel(role).toLowerCase()} to assign
            {patientName ? ` to ${patientName}` : ''}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assign-care-team">
              {roleLabel(role)} list
            </Label>
            <select
              id="assign-care-team"
              className="border-input h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="">
                {isLoading ? 'Loading…' : 'Select a user'}
              </option>
              {activeUsers.map(
                (u: { id: number; username: string; first_name?: string; last_name?: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name || u.last_name
                      ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                      : u.username}
                  </option>
                ),
              )}
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !selectedId}>
              {assign.isPending ? 'Assigning…' : `Assign ${roleLabel(role)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
