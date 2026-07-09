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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRetrySynapse } from '../api/use-retry-synapse';

interface SynapseRetryDialogProps {
  userId: number | string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SynapseRetryDialog({
  userId,
  username,
  open,
  onOpenChange,
}: SynapseRetryDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const retry = useRetrySynapse();

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    retry.mutate(
      { id: userId, password },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retry Synapse account creation</DialogTitle>
          <DialogDescription>
            Re-queue Matrix account creation for{' '}
            <strong>{username}</strong>. Matrix requires a password to create
            an account. This password will be set on the new Synapse account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              If the account is already <strong>CREATED</strong>, this is a
              no-op.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Label htmlFor="synapse-password">Matrix password</Label>
            <Input
              id="synapse-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={retry.isPending}>
              {retry.isPending ? 'Queueing…' : 'Retry creation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
