'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Loader2, PackageCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import {
  useActivateNest,
  useOnboardingStatus,
} from '@/features/auth/api/use-onboarding';
import {
  useResendVerifyEmail,
  useVerifyEmail,
} from '@/features/auth/api/use-verify-email';

/**
 * Blocks B2C patients from the dashboard until email is verified
 * and Nest activation code (from delivered package) is entered.
 */
export default function OnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const isPatient = String(user?.role || '').toLowerCase() === 'patient';
  const statusQ = useOnboardingStatus(Boolean(user) && isPatient);
  const activateM = useActivateNest();
  const verifyM = useVerifyEmail();
  const resendM = useResendVerifyEmail();

  const [verifyCode, setVerifyCode] = useState('');
  const [nestCode, setNestCode] = useState('');

  // Non-patients / still loading user: pass through.
  if (!user || !isPatient) {
    return <>{children}</>;
  }

  if (statusQ.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('loading', 'Loading…')}
      </div>
    );
  }

  const status = statusQ.data;
  // Clinic patients without Nest order, or already unlocked.
  if (!status || status.panel_unlocked || !status.has_nest_order) {
    return <>{children}</>;
  }

  const needEmail = !status.email_verified;
  const needNest = status.email_verified && !status.nest_activated;

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = user.username || user.email;
    if (!identifier || verifyCode.trim().length !== 6) {
      toast.error(t('verify_err_code', 'Enter the 6-digit code from your email'));
      return;
    }
    try {
      const res = await verifyM.mutateAsync({
        identifier,
        code: verifyCode.trim(),
      });
      toast.success(res.message);
      statusQ.refetch();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('verify_err_failed', 'Verification failed'));
    }
  };

  const onActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nestCode.trim()) {
      toast.error(
        t('nest_err_code', 'Enter the activation code from your Nest package'),
      );
      return;
    }
    try {
      const res = await activateM.mutateAsync(nestCode.trim().toUpperCase());
      toast.success(res.message);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('nest_err_failed', 'Activation failed'));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          {needEmail ? (
            <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-primary" />
          ) : (
            <PackageCheck className="mt-0.5 h-8 w-8 shrink-0 text-primary" />
          )}
          <div>
            <h1 className="text-xl font-semibold">
              {needEmail
                ? t('onboard_verify_title', 'Verify your email')
                : t('onboard_nest_title', 'Activate your Nest')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {needEmail
                ? t(
                    'onboard_verify_body',
                    'We sent a code to {{email}}. Confirm it to continue.',
                    { email: status.masked_email || 'your email' },
                  )
                : t(
                    'onboard_nest_body',
                    'When your Senio Nest package arrives, enter the activation code from the box to unlock your panel.',
                  )}
            </p>
          </div>
        </div>

        {needEmail && (
          <form onSubmit={onVerify} className="space-y-3">
            <div>
              <Label htmlFor="verify-code">
                {t('verification_code', 'Verification code')}
              </Label>
              <Input
                id="verify-code"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="mt-1 tracking-[0.3em]"
                placeholder="••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={verifyM.isPending}>
              {verifyM.isPending
                ? t('verifying', 'Verifying…')
                : t('verify_email_submit', 'Verify email')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={resendM.isPending}
              onClick={async () => {
                const id = user.username || user.email;
                if (!id) return;
                try {
                  const res = await resendM.mutateAsync(id);
                  toast.success(res.message);
                } catch {
                  toast.error(t('verify_err_resend', 'Could not resend code'));
                }
              }}
            >
              {t('resend_code', 'Resend code')}
            </Button>
          </form>
        )}

        {needNest && (
          <form onSubmit={onActivate} className="space-y-3">
            <div>
              <Label htmlFor="nest-code">
                {t('nest_activation_code', 'Nest activation code')}
              </Label>
              <Input
                id="nest-code"
                dir="ltr"
                value={nestCode}
                onChange={(e) => setNestCode(e.target.value.toUpperCase())}
                className="mt-1 tracking-widest"
                placeholder="XXXX-XXXX"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={activateM.isPending}
            >
              {activateM.isPending
                ? t('activating', 'Activating…')
                : t('activate_nest_submit', 'Unlock panel')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t(
                'nest_wait_hint',
                'Code is emailed when the package is marked delivered.',
              )}
            </p>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/auth/verify-email" className="underline-offset-4 hover:underline">
          {t('open_verify_page', 'Open email verification page')}
        </Link>
      </p>
    </div>
  );
}
