'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, RefreshCw, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useSignOut } from '@/features/auth/api/use-sign-out';
import {
  useMyApplication,
  useUploadPaymentReceipt,
} from '../api/use-applications';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { ApplicationTimeline } from './ApplicationTimeline';
import {
  formatDateTime,
  formatMoney,
  isReceiptFileValid,
  personDisplayName,
} from '../utils/applications';
import { MAX_RECEIPT_BYTES, RECEIPT_ACCEPT } from '../types/applications';

export function ApplicationStatusView() {
  const { t } = useTranslation();
  const hasToken = Boolean(Cookies.get('access_token'));
  const { data, isLoading, isError, error, refetch, isFetching } = useMyApplication({
    enabled: hasToken,
  });
  const upload = useUploadPaymentReceipt();
  const signOut = useSignOut();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  const onPickFile = (file: File | null) => {
    if (!file) {
      setLocalFile(null);
      return;
    }
    const check = isReceiptFileValid(file);
    if (check.ok === false) {
      toast.error(t('err_receipt_invalid', check.reason));
      return;
    }
    setLocalFile(file);
  };

  const onUpload = async () => {
    if (!localFile) {
      toast.error(t('err_receipt_required', 'Please select a receipt file'));
      return;
    }
    try {
      await upload.mutateAsync(localFile);
      setLocalFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      // toasted
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <header
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
        className="border-b bg-background/80 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            SenioSentry
          </Link>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <LanguageToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label={t('refresh', 'Refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut className="me-1.5 h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t('app_status_title', 'Application status')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t(
            'app_status_subtitle',
            'Track your clinic application, payment, and approval progress.'
          )}
        </p>

        {!hasToken && (
          <div className="mt-8 rounded-2xl border bg-card p-6 text-center">
            <p className="text-muted-foreground">
              {t('app_status_need_signin', 'Sign in to view your application status.')}
            </p>
            <Button asChild className="mt-4">
              <Link href="/auth/sign-in">{t('sign_in')}</Link>
            </Button>
          </div>
        )}

        {hasToken && isLoading && (
          <div className="mt-12 flex justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {hasToken && isError && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-card p-6">
            <p className="text-destructive">
              {t('err_load_application', 'Could not load your application.')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)?.message}
            </p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              {t('try_again', 'Try again')}
            </Button>
          </div>
        )}

        {hasToken && !isLoading && !isError && !data && (
          <div className="mt-8 rounded-2xl border bg-card p-6 text-center">
            <p className="text-muted-foreground">
              {t('app_status_none', 'No application found for this account.')}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/apply">{t('apply_now', 'Apply now')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">{t('dashboard')}</Link>
              </Button>
            </div>
          </div>
        )}

        {data && (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('current_status', 'Current status')}
                  </p>
                  <div className="mt-1">
                    <ApplicationStatusBadge status={data.status} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('updated', 'Updated')}: {formatDateTime(data.updated_at || data.created_at)}
                </p>
              </div>
              <div className="mt-6">
                <ApplicationTimeline status={data.status} />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {t('clinic', 'Clinic')}
                </h2>
                <p className="mt-1 font-semibold">{data.clinic?.name ?? '—'}</p>
                {data.clinic?.address && (
                  <p className="mt-1 text-sm text-muted-foreground">{data.clinic.address}</p>
                )}
                {data.clinic?.phone && (
                  <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                    {data.clinic.phone}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {t('patient', 'Patient')}
                </h2>
                <p className="mt-1 font-semibold">{personDisplayName(data.patient)}</p>
                {data.patient?.national_code && (
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {t('national_code', 'National code')}: {data.patient.national_code}
                  </p>
                )}
                {data.patient?.dob && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t('date_of_birth', 'Date of birth')}: {data.patient.dob}
                  </p>
                )}
              </div>
            </section>

            {data.status === 'payment_pending' && (
              <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-6 dark:border-orange-900 dark:bg-orange-950/30">
                <h2 className="text-lg font-bold">
                  {t('app_payment_required', 'Payment required')}
                </h2>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {formatMoney(data.payment_amount, data.currency)}
                </p>
                {data.payment_instructions && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                    {data.payment_instructions}
                  </p>
                )}

                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-medium">
                    {t('upload_receipt', 'Upload payment receipt')}
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={RECEIPT_ACCEPT}
                    className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('receipt_hint', 'Image or PDF, max 5MB')}
                  </p>
                  {localFile && (
                    <p className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      {localFile.name} ({Math.round(localFile.size / 1024)} KB)
                      {localFile.size > MAX_RECEIPT_BYTES && (
                        <span className="text-destructive"> — too large</span>
                      )}
                    </p>
                  )}
                  <Button onClick={onUpload} disabled={upload.isPending || !localFile}>
                    {upload.isPending ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="me-2 h-4 w-4" />
                    )}
                    {t('submit_receipt', 'Submit receipt')}
                  </Button>
                </div>
              </section>
            )}

            {data.status === 'payment_submitted' && (
              <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 dark:border-violet-900 dark:bg-violet-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-violet-600" />
                  <div>
                    <h2 className="font-bold">
                      {t('app_payment_verification', 'Payment verification pending')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        'app_payment_verification_body',
                        'Your receipt was received. The clinic will verify payment shortly.'
                      )}
                    </p>
                    {(data.receipt_name || data.receipt?.filename) && (
                      <p className="mt-2 text-sm">
                        {t('receipt_file', 'Receipt')}:{' '}
                        {data.receipt_name || data.receipt?.filename}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {data.status === 'rejected' && (
              <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 dark:border-red-900 dark:bg-red-950/30">
                <h2 className="font-bold text-red-800 dark:text-red-300">
                  {t('app_rejected_title', 'Application rejected')}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {data.rejection_reason ||
                    data.rejection_note ||
                    data.review_note ||
                    data.note ||
                    t('app_rejected_no_reason', 'No reason provided.')}
                </p>
              </section>
            )}

            {data.status === 'approved' && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h2 className="mt-3 text-lg font-bold">
                  {t('app_approved_title', 'You are approved')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    'app_approved_body',
                    'Your application was approved. Open the care dashboard to get started.'
                  )}
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">{t('go_to_dashboard', 'Go to dashboard')}</Link>
                </Button>
              </section>
            )}

            {(data.review_note || data.note) &&
              data.status !== 'rejected' &&
              data.status !== 'approved' && (
                <section className="rounded-2xl border bg-card p-5 text-sm shadow-sm">
                  <h2 className="font-semibold">{t('clinic_note', 'Clinic note')}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {data.review_note || data.note}
                  </p>
                </section>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
