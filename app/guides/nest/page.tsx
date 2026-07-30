'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Camera, Wifi, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

export default function NestGuidePage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: BookOpen,
      title: t('nest_guide_step1_title', 'Unbox Nest'),
      body: t(
        'nest_guide_step1_body',
        'Place Nest on a stable surface with a clear view of the main living area. Keep power and Wi‑Fi within reach.',
      ),
    },
    {
      icon: Wifi,
      title: t('nest_guide_step2_title', 'Power & network'),
      body: t(
        'nest_guide_step2_body',
        'Connect power, then join Nest to your home Wi‑Fi using the pairing sheet in the box (or ethernet if available).',
      ),
    },
    {
      icon: Camera,
      title: t('nest_guide_step3_title', 'Camera & sensors'),
      body: t(
        'nest_guide_step3_body',
        'Confirm the status light is steady. Fall camera and environment sensors start after the first successful cloud handshake.',
      ),
    },
    {
      icon: Shield,
      title: t('nest_guide_step4_title', 'Activate in SenioSentry'),
      body: t(
        'nest_guide_step4_body',
        'After delivery you receive an activation path by email. Enter your order number in the app to unlock monitoring.',
      ),
    },
  ];

  return (
    <div
      style={{ paddingTop: 'var(--app-sat, 0px)' }}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background" />
        <div className="absolute -top-24 start-[-10%] h-[24rem] w-[24rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-0 end-[-8%] h-[20rem] w-[20rem] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <header className="relative z-20 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="overflow-hidden rounded-xl border border-border/60 bg-white p-1 shadow-sm dark:bg-zinc-900">
              <Image
                src="/assets/images/logo.png"
                alt=""
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </span>
            <span className="text-lg font-bold tracking-tight">SenioSentry</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ModeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Senio Nest
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('nest_guide_title', 'Install & pairing')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {t(
            'nest_guide_body',
            'Four steps from unboxing to live monitoring. Keep this page open while you set Nest up at home.',
          )}
        </p>

        <ol className="mt-12 space-y-0">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-5 border-s-2 border-border/70 pb-10 ps-8 last:pb-0"
            >
              <span className="absolute -start-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-lg font-semibold tracking-tight">{step.title}</p>
                <p className="mt-1.5 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-8 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl">
            <Link href="/order">
              {t('back_to_marketplace', 'Back to Nest')}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-xl bg-background/60">
            <Link href="/auth/sign-up">{t('setup_account', 'Account setup')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
