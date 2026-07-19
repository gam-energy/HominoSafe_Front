'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { ApplyForm } from '@/features/applications/components/ApplyForm';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { Button } from '@/components/ui/button';

export default function ApplyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            SenioSentry
          </Link>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/sign-in">{t('sign_in')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('apply_title', 'Apply for care access')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t(
              'apply_subtitle',
              'Create caregiver and patient accounts, choose your clinic, and submit for review.'
            )}
          </p>
        </div>
        <ApplyForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('already_have_account')}{' '}
          <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">
            {t('sign_in')}
          </Link>
        </p>
      </main>
    </div>
  );
}
