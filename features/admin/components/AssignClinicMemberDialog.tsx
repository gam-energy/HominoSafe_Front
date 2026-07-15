'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
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

import { useAssignClinicMember } from '../api/use-clinics';
import { useGetUsersByRole } from '@/features/users-list/api/use-get-users-by-role';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: number;
  clinicName: string;
  role: 'DOCTOR' | 'PATIENT' | 'CAREGIVER';
  excludeIds?: number[];
}

interface ListedUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
}

export function AssignClinicMemberDialog({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  role,
  excludeIds = [],
}: Props) {
  const [q, setQ] = useState('');
  // useGetUsersByRole only accepts 'caregiver' | 'doctor'; for patients we fall back to admin/users/role/PATIENT via a direct call.
  const roleKey = role === 'CAREGIVER' ? 'caregiver' : role === 'DOCTOR' ? 'doctor' : ('doctor' as any);
  const fallbackPatients = usePatientsFallback(role === 'PATIENT');
  const doctorsOrCaregivers = useGetUsersByRole(roleKey as 'caregiver' | 'doctor');

  const assign = useAssignClinicMember(clinicId);

  const list: ListedUser[] = useMemo(() => {
    let src: any[] = [];
    if (role === 'PATIENT') {
      src = fallbackPatients.data ?? [];
    } else {
      src = doctorsOrCaregivers.data ?? [];
    }
    const filtered = src.filter((u) => !excludeIds.includes(u.id));
    if (!q.trim()) return filtered;
    const needle = q.toLowerCase();
    return filtered.filter((u) =>
      [u.username, u.first_name, u.last_name, u.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [role, fallbackPatients.data, doctorsOrCaregivers.data, q, excludeIds]);

  const loading =
    role === 'PATIENT' ? fallbackPatients.isLoading : doctorsOrCaregivers.isLoading;

  const onPick = async (u: ListedUser) => {
    try {
      await assign.mutateAsync(u.id);
      toast.success(`${u.username} added to ${clinicName}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to assign member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {role.toLowerCase()}</DialogTitle>
          <DialogDescription>Pick an existing user to join {clinicName}.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, username, email…"
            className="pl-8"
          />
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : list.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No {role.toLowerCase()}s available.
            </div>
          ) : (
            list.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border-b px-3 py-2 last:border-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onPick(u)}>
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Patients aren't covered by useGetUsersByRole; fetch them directly here.
import axiosInstance from '@/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';

function usePatientsFallback(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-users-role', 'patient'],
    enabled,
    queryFn: async () => {
      const { data } = await axiosInstance.get<ListedUser[]>(`/admin/users/role/patient`);
      return data;
    },
  });
}
