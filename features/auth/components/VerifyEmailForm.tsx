'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useResendVerifyEmail,
  useVerifyEmail,
} from '@/features/auth/api/use-verify-email';

export default function VerifyEmailForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const [identifier, setIdentifier] = useState(
    () => search.get('identifier') || search.get('username') || '',
  );
  const [code, setCode] = useState('');

  const verifyM = useVerifyEmail();
  const resendM = useResendVerifyEmail();

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error(t('verify_err_identifier', 'Enter your username or email'));
      return;
    }
    if (!code.trim() || code.trim().length !== 6) {
      toast.error(t('verify_err_code', 'Enter the 6-digit code from your email'));
      return;
    }
    try {
      const res = await verifyM.mutateAsync({
        identifier: identifier.trim(),
        code: code.trim(),
      });
      toast.success(res.message);
      router.push('/auth/sign-in');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('verify_err_failed', 'Verification failed'));
    }
  };

  const onResend = async () => {
    if (!identifier.trim()) {
      toast.error(t('verify_err_identifier', 'Enter your username or email'));
      return;
    }
    try {
      const res = await resendM.mutateAsync(identifier.trim());
      toast.success(res.message);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail || t('verify_err_resend', 'Could not resend code'));
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900 md:p-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <MailCheck className="mb-3 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold">
          {t('verify_email_title', 'Verify your email')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            'verify_email_subtitle',
            'Enter the 6-digit code we sent after signup. Then sign in and activate Nest when your package arrives.',
          )}
        </p>
      </div>

      <form onSubmit={onVerify} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="identifier">
            {t('username_or_email', 'Username or email')}
          </Label>
          <Input
            id="identifier"
            dir="ltr"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1"
            autoComplete="username"
          />
        </div>
        <div>
          <Label htmlFor="code">{t('verification_code', 'Verification code')}</Label>
          <Input
            id="code"
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            className="mt-1 tracking-[0.3em]"
          />
        </div>
        <Button type="submit" className="w-full" disabled={verifyM.isPending}>
          {verifyM.isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('verifying', 'Verifying…')}
            </>
          ) : (
            t('verify_email_submit', 'Verify email')
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onResend}
          disabled={resendM.isPending}
        >
          {resendM.isPending
            ? t('sending', 'Sending…')
            : t('resend_code', 'Resend code')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
          {t('back_to_sign_in', 'Back to sign in')}
        </Link>
      </p>
    </div>
  );
}
