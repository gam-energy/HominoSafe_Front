'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Home,
  Building2,
  Camera,
  Wifi,
  Stethoscope,
  UserRound,
  Package,
  CheckCircle2,
  HelpCircle,
  Thermometer,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { cn } from '@/lib/utils';

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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (isNativeAppShell()) {
      setShowApkDownload(false);
      return;
    }
    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => setShowApkDownload(r.ok))
      .catch(() => setShowApkDownload(false));
  }, []);

  const nestJourney = [
    {
      icon: Package,
      title: t('landing_nest_step1', 'Order Nest'),
      body: t(
        'landing_nest_step1_body',
        'Buy Senio Nest for €780 — device plus one year of monitoring included.'
      ),
    },
    {
      icon: CreditCard,
      title: t('landing_nest_step2', 'Pay & ship'),
      body: t(
        'landing_nest_step2_body',
        'We confirm payment, ship Nest, and send your order number for account setup.'
      ),
    },
    {
      icon: Home,
      title: t('landing_nest_step3', 'Install at home'),
      body: t(
        'landing_nest_step3_body',
        'Follow the install guide, pair the device, and start home monitoring.'
      ),
    },
    {
      icon: LayoutDashboard,
      title: t('landing_nest_step4', 'Watch over care'),
      body: t(
        'landing_nest_step4_body',
        'Vitals, fall camera, environment sensors, and alerts stay available in the patient panel.'
      ),
    },
  ];

  const clinicJourney = [
    {
      icon: ClipboardList,
      title: t('landing_step_apply', 'Apply'),
      body: t(
        'landing_step_apply_body',
        'Apply alone or with a caregiver — use an EHR code or enter the profile manually.'
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

  const audiences = [
    {
      icon: UserRound,
      title: t('landing_for_patients', 'Patients'),
      body: t(
        'landing_for_patients_body',
        'Stay monitored at home with Nest, or enroll through your clinic with a supervised care plan.'
      ),
    },
    {
      icon: Users,
      title: t('landing_for_families', 'Families & caregivers'),
      body: t(
        'landing_for_families_body',
        'See what matters, get alerts when attention is needed, and coordinate without guesswork.'
      ),
    },
    {
      icon: Stethoscope,
      title: t('landing_for_clinics', 'Clinics & doctors'),
      body: t(
        'landing_for_clinics_body',
        'Review applications, keep a shared care record, and stay connected to patients outside the visit.'
      ),
    },
  ];

  const monitors = [
    {
      icon: HeartPulse,
      title: t('landing_mon_vitals', 'Wearable vitals'),
      body: t(
        'landing_mon_vitals_body',
        'Heart rate, SpO2, activity, and trends that show how the day is going.'
      ),
    },
    {
      icon: Camera,
      title: t('landing_mon_fall', 'Fall camera'),
      body: t(
        'landing_mon_fall_body',
        'Nest’s fall camera helps confirm falls at home and reduce false alarms.'
      ),
    },
    {
      icon: Thermometer,
      title: t('landing_mon_env', 'Environment sensors'),
      body: t(
        'landing_mon_env_body',
        'Nest tracks room temperature, humidity, CO₂, and gas so living conditions stay visible.'
      ),
    },
    {
      icon: BellRing,
      title: t('landing_mon_alerts', 'Care alerts'),
      body: t(
        'landing_mon_alerts_body',
        'Timely notifications for caregivers and care teams when risk rises.'
      ),
    },
    {
      icon: Activity,
      title: t('landing_mon_ai', 'AI care insights'),
      body: t(
        'landing_mon_ai_body',
        'Predictive signals and secure chat to keep everyone aligned.'
      ),
    },
  ];

  const features = [
    {
      icon: Wifi,
      title: t('landing_feat_home', 'Home-first monitoring'),
      body: t(
        'landing_feat_home_body',
        'Senio Nest brings edge monitoring into daily life — not only into the clinic.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('landing_feat_clinic', 'Clinic-backed onboarding'),
      body: t(
        'landing_feat_clinic_body',
        'Clinic apply keeps enrollment reviewed and trusted when supervised care is needed.'
      ),
    },
    {
      icon: HeartPulse,
      title: t('landing_feat_vitals', 'Continuous vitals awareness'),
      body: t(
        'landing_feat_vitals_body',
        'Stay informed about heart rate, SpO2, and other key signals.'
      ),
    },
    {
      icon: Building2,
      title: t('landing_feat_record', 'Shared care visibility'),
      body: t(
        'landing_feat_record_body',
        'Patients, caregivers, and clinicians can work from the same care picture.'
      ),
    },
  ];

  const faqs = [
    {
      q: t('landing_faq1_q', 'What does the €780 Nest package include?'),
      a: t(
        'landing_faq1_a',
        'Senio Nest hardware — fall camera and environment sensors — plus one year of SenioSentry monitoring. There is no separate annual charge for that first year.'
      ),
    },
    {
      q: t('landing_faq2_q', 'Do I need a clinic to start?'),
      a: t(
        'landing_faq2_a',
        'No. Buy Nest for home monitoring, then set up your patient account after payment. Clinic apply is for supervised enrollment through a clinic.'
      ),
    },
    {
      q: t('landing_faq3_q', 'Can I apply without a caregiver?'),
      a: t(
        'landing_faq3_a',
        'Yes. Clinic apply supports patient-only enrollment. You can later request additional caregivers from your panel.'
      ),
    },
    {
      q: t('landing_faq4_q', 'What if we cannot connect to an EHR system?'),
      a: t(
        'landing_faq4_a',
        'You can enter an EHR code during apply. SenioSentry fills the profile from seed medical data when live EHR services are unavailable.'
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
        className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900">
              <Image
                src="/assets/images/logo.png"
                alt=""
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </span>
            <span className="text-xl font-bold tracking-tight">SenioSentry</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#nest" className="hover:text-foreground transition-colors">
              {t('nav_nest', 'Nest')}
            </a>
            <a href="#paths" className="hover:text-foreground transition-colors">
              {t('nav_paths', 'Paths')}
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              {t('nav_how', 'How it works')}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              {t('nav_faq', 'FAQ')}
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ModeToggle />
            <LanguageToggle />
            {showApkDownload && (
              <Button asChild variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
                <a href={APK_URL} download="SenioSentry.apk">
                  <Download className="h-4 w-4" aria-hidden />
                  {t('download_app', 'Download app')}
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
              <Link href="/order">{t('buy_nest', 'Buy Nest')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — one composition */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background" />
            <div className="absolute -top-32 start-[-10%] h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10 animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute top-24 end-[-8%] h-[22rem] w-[22rem] rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/[0.07] animate-[pulse_10s_ease-in-out_infinite]" />
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
              }}
            />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center gap-10 px-4 py-16 md:py-20">
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                SenioSentry
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
                {t(
                  'landing_hero_title',
                  'Care that stays with your family — even when you cannot.'
                )}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                {t(
                  'landing_hero_body',
                  'Order Senio Nest for home monitoring, then set up your patient account — or apply through your clinic for supervised care.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base shadow-lg shadow-primary/20">
                  <Link href="/order">
                    {t('buy_nest_cta', 'Buy Senio Nest — €780')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl px-6 text-base bg-background/60 backdrop-blur"
                >
                  <Link href="/apply">{t('clinic_apply', 'Clinic apply')}</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-12 rounded-xl px-6 text-base">
                  <Link href="/auth/sign-in">{t('sign_in')}</Link>
                </Button>
              </div>
              {showApkDownload && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild variant="secondary" size="sm" className="rounded-xl gap-2">
                    <a href={APK_URL} download="SenioSentry.apk">
                      <Smartphone className="h-4 w-4" aria-hidden />
                      {t('download_android_app', 'Download Android app')}
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'download_android_app_hint',
                      'Install the Android APK for a full-screen app (no browser chrome).'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Nest product */}
        <section id="nest" className="scroll-mt-24 border-y bg-muted/35 py-20 dark:bg-zinc-900/35">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t('landing_nest_eyebrow', 'Senio Nest')}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing_nest_title', 'One home monitor. One clear package.')}
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground text-lg">
                {t(
                  'landing_nest_body',
                  'Nest is the home edge device with a fall camera and environment sensors. The €780 package includes the hardware and a full year of SenioSentry monitoring — buy Nest before patient setup.'
                )}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  t('landing_nest_bullet1', 'Fall detection camera'),
                  t('landing_nest_bullet2', 'Environment sensors (temp, humidity, CO₂, gas)'),
                  t('landing_nest_bullet3', '1 year of monitoring included'),
                  t('landing_nest_bullet4', 'Account setup unlocks after payment confirmation'),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11 rounded-xl">
                  <Link href="/order">
                    {t('buy_nest_cta', 'Buy Senio Nest — €780')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl">
                  <Link href="/order-status">{t('track_order', 'Track order')}</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/25 via-sky-400/10 to-transparent blur-2xl"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[1.75rem] border bg-card p-7 shadow-xl shadow-primary/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {t('marketplace', 'Marketplace')}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold">Senio Nest</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(
                        'landing_nest_card_body',
                        'Home edge monitor with fall camera, environment sensors, and year-one monitoring.'
                      )}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-3xl font-black tracking-tight ltr-nums">€780</p>
                    <p className="text-xs text-muted-foreground">EUR · package</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <Camera className="h-5 w-5 text-primary mb-2" />
                    <p className="font-semibold">{t('landing_nest_cam', 'Fall camera')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('landing_nest_cam_body', 'Confirm falls at home')}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <Thermometer className="h-5 w-5 text-primary mb-2" />
                    <p className="font-semibold">{t('landing_nest_env', 'Env sensors')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('landing_nest_env_body', 'Temp, humidity, CO₂, gas')}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                    <p className="font-semibold">{t('landing_nest_year', 'Year included')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('landing_nest_year_body', 'Monitoring for 12 months')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two paths */}
        <section id="paths" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing_paths_title', 'Two ways to begin')}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                {t(
                  'landing_paths_body',
                  'Choose home monitoring with Nest, or supervised enrollment through your clinic.'
                )}
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border bg-card p-7 shadow-sm">
                <Home className="h-7 w-7 text-primary" />
                <h3 className="mt-4 text-xl font-bold">
                  {t('landing_path_home', 'Home with Senio Nest')}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    'landing_path_home_body',
                    'Best when you want independent home monitoring. Buy Nest first, then set up the patient account with your paid order number.'
                  )}
                </p>
                <Button asChild className="mt-6 rounded-xl">
                  <Link href="/order">
                    {t('buy_nest', 'Buy Nest')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="rounded-[1.5rem] border bg-card p-7 shadow-sm">
                <Building2 className="h-7 w-7 text-primary" />
                <h3 className="mt-4 text-xl font-bold">
                  {t('landing_path_clinic', 'Clinic-supervised apply')}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    'landing_path_clinic_body',
                    'Best when a clinic should review enrollment. Apply alone or with a caregiver, optionally with an EHR code for seeded medical profile data.'
                  )}
                </p>
                <Button asChild variant="outline" className="mt-6 rounded-xl">
                  <Link href="/apply">
                    {t('clinic_apply', 'Clinic apply')}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-y bg-muted/35 py-20 dark:bg-zinc-900/35">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing_audience_title', 'Made for everyone in the care circle')}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t(
                  'landing_audience_body',
                  'Patients stay safer at home. Families stay informed. Clinics stay connected.'
                )}
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {audiences.map((item) => (
                <div key={item.title} className="rounded-2xl border bg-card p-6">
                  <item.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Nest monitors */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing_monitor_title', 'What SenioSentry watches')}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                {t(
                  'landing_monitor_body',
                  'From wearable signals to home events — clarity without noise.'
                )}
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {monitors.map((item) => (
                <div key={item.title} className="rounded-2xl border bg-card/90 p-5">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 border-y bg-muted/35 py-20 dark:bg-zinc-900/35">
          <div className="mx-auto max-w-6xl px-4 space-y-16">
            <div>
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight">
                  {t('landing_nest_flow_title', 'Nest journey')}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    'landing_nest_flow_body',
                    'From marketplace order to living-room peace of mind.'
                  )}
                </p>
              </div>
              <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {nestJourney.map((step, idx) => (
                  <li key={step.title} className="rounded-2xl border bg-card p-5">
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

            <div>
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight">
                  {t('landing_process_title', 'Clinic apply journey')}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    'landing_process_body',
                    'A clear path from family application to clinic-approved care access.'
                  )}
                </p>
              </div>
              <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {clinicJourney.map((step, idx) => (
                  <li key={step.title} className="rounded-2xl border bg-card p-5">
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
          </div>
        </section>

        {/* Trust / features */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing_trust_title', 'Built for families who care')}
              </h2>
              <p className="mt-3 text-muted-foreground">
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
                  <h3 className="mt-3 font-semibold text-lg">{feat.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 border-y bg-muted/35 py-20 dark:bg-zinc-900/35">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center">
              <HelpCircle className="mx-auto h-7 w-7 text-primary" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                {t('landing_faq_title', 'Common questions')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t('landing_faq_body', 'Quick answers before you order or apply.')}
              </p>
            </div>
            <div className="mt-10 space-y-3">
              {faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="rounded-2xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      aria-expanded={open}
                    >
                      <span className="font-semibold">{item.q}</span>
                      <span
                        className={cn(
                          'text-muted-foreground transition-transform',
                          open && 'rotate-45'
                        )}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-out',
                        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-primary/30 bg-gradient-to-br from-primary to-blue-700 px-6 py-14 text-primary-foreground shadow-lg dark:from-blue-600 dark:to-blue-900 sm:px-12">
              <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing_cta_title', 'Ready for home monitoring?')}
              </h2>
              <p className="mt-4 max-w-lg text-primary-foreground/90 text-lg">
                {t(
                  'landing_cta_body',
                  'Buy Senio Nest (€780, includes 1-year monitoring), then set up your patient account after payment — or apply through your clinic.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-xl font-semibold"
                >
                  <Link href="/order">{t('buy_nest_cta', 'Buy Senio Nest — €780')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/apply">{t('clinic_apply', 'Clinic apply')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-xl text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/auth/sign-up?role=doctor">
                    {t('doctor_signup', 'Doctor sign up')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/90 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-lg font-bold">SenioSentry</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t(
                'landing_footer_tag',
                'Smart care for the people you love — at home and with your clinic.'
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">{t('landing_footer_product', 'Product')}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/order" className="hover:text-foreground">
                {t('buy_nest', 'Buy Nest')}
              </Link>
              <Link href="/order-status" className="hover:text-foreground">
                {t('track_order', 'Track order')}
              </Link>
              <Link href="/apply" className="hover:text-foreground">
                {t('apply_now', 'Apply now')}
              </Link>
              <Link href="/application-status" className="hover:text-foreground">
                {t('app_status_title', 'Application status')}
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">{t('landing_footer_account', 'Account')}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/auth/sign-in" className="hover:text-foreground">
                {t('sign_in')}
              </Link>
              <Link href="/auth/sign-up?role=doctor" className="hover:text-foreground">
                {t('doctor_signup', 'Doctor sign up')}
              </Link>
              {showApkDownload && (
                <a href={APK_URL} download="SenioSentry.apk" className="hover:text-foreground">
                  {t('download_android_app', 'Download Android app')}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t px-4 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SenioSentry
        </div>
      </footer>
    </div>
  );
}
