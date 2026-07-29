'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { relationships } from '@/features/auth/types/auth';
import { extractErrorMessage } from '../utils/adminErrors';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
  relationship_to_patient: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  patientId: number;
  patientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCaregiverForPatientDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const [relationship, setRelationship] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      relationship_to_patient: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: created } = await axiosInstance.post(
        '/admin/users',
        {
          ...values,
          role: 'caregiver',
          status: 'active',
          relationship_to_patient:
            values.relationship_to_patient || relationship || undefined,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      await axiosInstance.post(
        '/admin/assign-patient',
        {
          patient_id: patientId,
          role_assignment: 'caregiver',
          assign_user_id: created.id,
          make_primary: true,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return created;
    },
    onSuccess: () => {
      toast.success(
        'Caregiver created and assigned. Login password was emailed to them.',
      );
      qc.invalidateQueries({ queryKey: ['admin-user', patientId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-relations'] });
      reset();
      setRelationship('');
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to create caregiver.'));
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutation.mutate({
      ...data,
      relationship_to_patient: relationship || data.relationship_to_patient,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create caregiver</DialogTitle>
          <DialogDescription>
            Create a new caregiver and assign them as primary for
            {patientName ? ` ${patientName}` : ' this patient'}. A password is
            generated and emailed to them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['username', 'Username'],
              ['email', 'Email'],
              ['first_name', 'First name'],
              ['last_name', 'Last name'],
              ['phone_number', 'Phone'],
            ] as const
          ).map(([name, label]) => (
            <div key={name} className="flex flex-col gap-1">
              <Label htmlFor={name}>{label}</Label>
              <input
                id={name}
                type="text"
                {...register(name)}
                className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
              />
              {errors[name] && (
                <span className="text-xs text-destructive">
                  {errors[name]?.message}
                </span>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label>Relationship to patient</Label>
            <Select value={relationship || undefined} onValueChange={setRelationship}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {relationships.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create & assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
