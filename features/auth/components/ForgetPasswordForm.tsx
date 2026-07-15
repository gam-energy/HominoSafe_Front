'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import {
  useForgotPasswordConfirm,
  useForgotPasswordRequest,
} from '@/features/auth/api/use-forgot-password';

export default function ForgetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requestM = useForgotPasswordRequest();
  const confirmM = useForgotPasswordConfirm();

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error(t('fp_err_identifier'));
      return;
    }
    try {
      const res = await requestM.mutateAsync(identifier.trim());
      if (res.code) {
        setDevCode(res.code);
        setCode(res.code);
      } else {
        setDevCode(null);
      }
      toast.success(res.message);
      setStep('confirm');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('fp_err_request'));
    }
  };

  const onConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      toast.error(t('fp_err_code'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('fp_err_password_min'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('fp_err_password_mismatch'));
      return;
    }
    try {
      const res = await confirmM.mutateAsync({
        identifier: identifier.trim(),
        code: code.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(res.message);
      router.push('/auth/sign-in');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('fp_err_confirm'));
    }
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center bg-secondary p-4">
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
        <ModeToggle />
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900 sm:p-8">
        <div className="mb-6 text-center">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold">{t('fp_title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 'request' ? t('fp_subtitle_request') : t('fp_subtitle_confirm')}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={onRequest} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">{t('fp_identifier')}</Label>
              <Input
                id="identifier"
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('fp_identifier_placeholder')}
                autoComplete="username"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={requestM.isPending}>
              {requestM.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('fp_send_code')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/auth/sign-in')}
            >
              {t('fp_back_sign_in')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="space-y-4">
            {devCode && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                {t('fp_code_shown')}:{' '}
                <span className="font-mono text-base font-bold tracking-widest ltr-nums" dir="ltr">
                  {devCode}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="code">{t('fp_code')}</Label>
              <Input
                id="code"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="tracking-widest"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t('fp_new_password')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  dir="ltr"
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pe-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t('fp_confirm_password')}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  dir="ltr"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pe-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={confirmM.isPending}>
              {confirmM.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('fp_reset_password')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('request');
                setCode('');
                setDevCode(null);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              {t('fp_try_again')}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
