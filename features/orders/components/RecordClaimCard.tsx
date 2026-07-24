'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileSearch, CheckCircle2, XCircle, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClaimRecord } from '@/features/orders/api/use-orders';

type Mode = 'choose' | 'claim' | 'manual' | 'done';

export function RecordClaimCard() {
  const router = useRouter();
  const claim = useClaimRecord();
  const [mode, setMode] = useState<Mode>('choose');
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
        setMode('done');
      } else {
        toast.error(r.message);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to look up record');
    }
  };

  const skipToDashboard = () => {
    setMode('done');
    router.push('/dashboard');
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          Patient national code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'choose' && (
          <>
            <p className="text-sm text-muted-foreground">
              Patients use a personal national / social-security code (not a clinic or
              business EHR code). Choose how to continue:
            </p>
            <div className="grid gap-3">
              <Button
                className="h-auto py-4 justify-start text-start"
                onClick={() => setMode('claim')}
              >
                <div>
                  <p className="font-semibold">I have a national code</p>
                  <p className="text-xs font-normal opacity-90 mt-0.5">
                    Look up an existing clinic record with your ID + date of birth
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start text-start"
                onClick={() => setMode('manual')}
              >
                <div className="flex items-start gap-2">
                  <UserRound className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Continue without linking a record</p>
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      You can add or update your national code later in profile
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </>
        )}

        {mode === 'claim' && (
          <>
            <p className="text-sm text-muted-foreground">
              Enter your personal national / social-security code and date of birth to
              match a record already in SenioSentry.
            </p>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="nc">National / Social Security code *</Label>
                <Input
                  id="nc"
                  required
                  minLength={5}
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value)}
                  placeholder="Your personal ID"
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('choose')}>
                  Back
                </Button>
                <Button type="submit" disabled={claim.isPending} className="flex-1">
                  {claim.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  Look up record
                </Button>
              </div>
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
          </>
        )}

        {mode === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can use SenioSentry without linking a clinic record now. Businesses and
              clinics do not use this national-code step — it is for patients only.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setMode('choose')}>
                Back
              </Button>
              <Button className="flex-1" onClick={skipToDashboard}>
                Continue to dashboard
              </Button>
            </div>
          </div>
        )}

        {mode === 'done' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/80 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold">You are all set.</p>
            </div>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
