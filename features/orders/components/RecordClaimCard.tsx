'use client';

import { useState } from 'react';
import { Loader2, FileSearch, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClaimRecord } from '@/features/orders/api/use-orders';

export function RecordClaimCard() {
  const claim = useClaimRecord();
  const [nationalCode, setNationalCode] = useState('');
  const [dob, setDob] = useState('');
  const [result, setResult] = useState<{
    matched: boolean;
    message: string;
    has_ehr: boolean;
  } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const r = await claim.mutateAsync({ national_code: nationalCode, dob });
      setResult(r);
      if (r.matched) {
        toast.success('Record found — staff will review and link it.');
      } else {
        toast.error(r.message);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to look up record');
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          Retrieve your health record
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If your clinic has already created a record for you, enter your national /
          social-security code and date of birth to link it to your account. Our team will
          review and connect it.
        </p>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nc">National / Social Security code *</Label>
            <Input
              id="nc"
              required
              value={nationalCode}
              onChange={(e) => setNationalCode(e.target.value)}
              placeholder="e.g. 1234567890"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dob">Date of birth *</Label>
            <Input
              id="dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={claim.isPending}>
            {claim.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            Look up record
          </Button>
        </form>

        {result && (
          <div
            className={
              'rounded-2xl border p-4 flex items-start gap-3 ' +
              (result.matched
                ? 'border-emerald-200/50 bg-emerald-50/80 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                : 'border-rose-200/50 bg-rose-50/80 dark:border-rose-900/30 dark:bg-rose-950/10')
            }
          >
            {result.matched ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-semibold">{result.message}</p>
              {result.matched && result.has_ehr && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your record includes an existing Electronic Health Record — it will be
                  visible once linked.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
