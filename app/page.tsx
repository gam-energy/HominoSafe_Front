'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  ShieldCheck,
  HeartPulse,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
  Users,
  BellRing,
  Activity,
  Download,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

const APK_URL = '/downloads/SenioSentry.apk';

function isNativeAppShell(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (ua.includes('SenioSentry-Android')) return true;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export default function LandingPage() {
  const { t } = useTranslation();
  const hasToken = Boolean(Cookies.get('access_token'));
  const [showApkDownload, setShowApkDownload] = useState(false);

  useEffect(() => {
    if (isNativeAppShell()) {
      setShowApkDownload(false);
      return;
    }
    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => setShowApkDownload(r.ok))
      .catch(() => setShowApkDownload(false));
  }, []);

  const steps = [
    {
      icon: ClipboardList,
      title: t('landing_step_apply', 'Apply'),
      body: t(
        'landing_step_apply_body',
        'Submit caregiver and patient details and choose your clinic.'
      ),
    },
    {
      icon: Users,
      title: t('landing_step_review', 'Clinic review'),
      body: t(
        'landing_step_review_body',
        'Your clinic reviews the application and confirms eligibility.'
      ),
    },
    {
      icon: CreditCard,
      title: t('landing_step_payment', 'Payment verification'),
      body: t(
        'landing_step_payment_body',
        'Complete payment and upload your receipt for verification.'
      ),
    },
    {
      icon: LayoutDashboard,
      title: t('landing_step_access', 'Access care panel'),
      body: t(
        'landing_step_access_body',
        'Once approved, monitor vitals, alerts, and care from one dashboard.'
      ),
    },
  ];

  const features = [
    {
      icon: HeartPulse,
      title: t('landing_feat_vitals', 'Continuous vitals awareness'),
      body: t(
        'landing_feat_vitals_body',
        'Stay informed about heart rate, SpO2, and other key signals.'
      ),
    },
    {
      icon: BellRing,
      title: t('landing_feat_alerts', 'Timely caregiver alerts'),
      body: t(
        'landing_feat_alerts_body',
        'Get notified when something needs attention — not after it is too late.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('landing_feat_clinic', 'Clinic-backed onboarding'),
      body: t(
        'landing_feat_clinic_body',
        'Applications are reviewed by your clinic so care starts with trust.'
      ),
    },
    {
      icon: Activity,
      title: t('landing_feat_ai', 'AI-assisted care insights'),
      body: t(
        'landing_feat_ai_body',
        'Use predictive insights and secure chat to coordinate care.'
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
        className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl font-bold tracking-tight">SenioSentry</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ModeToggle />
            <LanguageToggle />
            {showApkDownload && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={APK_URL} download="SenioSentry.apk">
                  <Download className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">
                    {t('download_app', 'Download app')}
                  </span>
                </a>
              </Button>
            )}
            {hasToken ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">{t('dashboard')}</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/sign-in">{t('sign_in')}</Link>
              </Button>
            )}
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/sign-up">{t("create_account", "Create account")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-32 start-[-10%] h-96 w-96 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
            <div className="absolute -top-20 end-[-5%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/[0.07]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-20">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                SenioSentry
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                {t(
                  'landing_hero_title',
                  'Care that stays with your family — even when you cannot.'
                )}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                {t(
                  'landing_hero_body',
                  'Create a patient account on your own or with a caregiver — or apply through your clinic for supervised care access.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
                  <Link href="/auth/sign-up">
                    {t('create_account', 'Create account')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl px-6 text-base"
                >
                  <Link href="/apply">{t('clinic_apply', 'Clinic apply')}</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-xl px-6 text-base"
                >
                  <Link href="/auth/sign-in">{t('sign_in')}</Link>
                </Button>
                {showApkDownload && (
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="h-12 rounded-xl px-6 text-base gap-2"
                  >
                    <a href={APK_URL} download="SenioSentry.apk">
                      <Smartphone className="h-4 w-4" aria-hidden />
                      {t('download_android_app', 'Download Android app')}
                    </a>
                  </Button>
                )}
              </div>
              {showApkDownload && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t(
                    'download_android_app_hint',
                    'Install the Android APK for a full-screen app (no browser chrome).'
                  )}
                </p>
              )}
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-emerald-400/10 to-transparent blur-2xl dark:from-primary/10 dark:via-emerald-500/5"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[1.75rem] border bg-card p-6 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('landing_panel_title', 'Family care panel')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('landing_panel_sub', 'Built for caregivers and clinics')}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3">
                  {[
                    t('landing_panel_item1', 'Clinic-reviewed caregiver applications'),
                    t('landing_panel_item2', 'Secure payment receipt verification'),
                    t('landing_panel_item3', 'Shared visibility into patient wellbeing'),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/40 py-16 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing_process_title', 'How application works')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t(
                  'landing_process_body',
                  'A clear path from family application to clinic-approved care access.'
                )}
              </p>
            </div>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, idx) => (
                <li key={step.title} className="relative rounded-2xl border bg-card p-5">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('step', 'Step')} {idx + 1}
                  </p>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing_trust_title', 'Built for families who care')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t(
                  'landing_trust_body',
                  'SenioSentry connects caregivers, patients, and clinics around safety and clarity.'
                )}
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {features.map((feat) => (
                <div key={feat.title} className="rounded-2xl border bg-card/80 p-6">
                  <feat.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">{feat.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-primary/30 bg-gradient-to-br from-primary to-blue-700 px-6 py-12 text-primary-foreground shadow-lg dark:from-blue-600 dark:to-blue-900 sm:px-12">
              <h2 className="max-w-xl text-3xl font-bold tracking-tight">
                {t('landing_cta_title', 'Ready to get started?')}
              </h2>
              <p className="mt-3 max-w-lg text-primary-foreground/90">
                {t(
                  'landing_cta_body',
                  'Create a patient account now, or apply through your clinic for supervised enrollment.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-11 rounded-xl font-semibold"
                >
                  <Link href="/auth/sign-up">{t('create_account', 'Create account')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-xl border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/apply">{t('clinic_apply', 'Clinic apply')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold">SenioSentry</p>
            <p className="text-sm text-muted-foreground">
              {t('landing_footer_tag', 'Smart care for the people you love.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/apply" className="hover:text-foreground">
              {t('apply_now', 'Apply now')}
            </Link>
            <Link href="/auth/sign-in" className="hover:text-foreground">
              {t('sign_in')}
            </Link>
            <Link href="/application-status" className="hover:text-foreground">
              {t('app_status_title', 'Application status')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
