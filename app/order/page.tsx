'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  Shield,
  Thermometer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateOrder,
  useMarketplaceCatalog,
  type CustomerOrder,
  type Gender,
} from '@/features/orders/api/use-orders';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { extractErrorMessage } from '@/features/admin/utils/adminErrors';
import { cn } from '@/lib/utils';

const FALLBACK_PRICE = 780;

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/14 via-background to-background" />
      <div className="absolute -top-28 start-[-12%] h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10 animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute top-40 end-[-10%] h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/[0.07] animate-[pulse_10s_ease-in-out_infinite]" />
      <div
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 18%, transparent 72%)',
        }}
      />
    </div>
  );
}

function NestShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div
      style={{ paddingTop: 'var(--app-sat, 0px)' }}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      <Atmosphere />
      <header className="relative z-20 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
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
            <span className="text-lg font-bold tracking-tight sm:text-xl">SenioSentry</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/order-status">{t('track_order', 'Track order')}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/guides/nest">{t('install_guide', 'Install guide')}</Link>
            </Button>
            <ModeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}

function NestDeviceVisual({ price }: { price: number }) {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-sky-400/15 to-emerald-400/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-zinc-950 text-white shadow-2xl shadow-primary/20 dark:border-zinc-700">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.25), transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative flex min-h-[22rem] flex-col justify-between p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Senio Nest
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t('nest_device_label', 'Home edge monitor')}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            </div>
          </div>

          <div className="my-8 flex flex-1 items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm sm:h-44 sm:w-44">
              <Camera className="h-14 w-14 text-sky-200/90 sm:h-16 sm:w-16" strokeWidth={1.25} />
              <div className="absolute -bottom-3 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
                {t('nest_live_ready', 'Ready to pair')}
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-5">
            <div className="grid grid-cols-3 gap-3 text-[11px] text-zinc-300 sm:text-xs">
              <span className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-sky-300" />
                {t('landing_nest_cam', 'Fall camera')}
              </span>
              <span className="flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-sky-300" />
                {t('landing_nest_env', 'Env sensors')}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-sky-300" />
                {t('landing_nest_year', 'Year included')}
              </span>
            </div>
            <p className="shrink-0 text-3xl font-black tracking-tight ltr-nums">
              €{Number(price).toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const createOrder = useCreateOrder();
  const { data: catalog } = useMarketplaceCatalog();
  const product = catalog?.products?.[0];
  const price = product?.price ?? FALLBACK_PRICE;
  const currency = product?.currency ?? 'EUR';

  const [step, setStep] = useState<'product' | 'checkout'>('product');
  const [placed, setPlaced] = useState<CustomerOrder | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_code: '',
    dob: '',
    gender: '' as Gender | '',
    notes: '',
  });

  const bullets = [
    t('landing_nest_bullet1', 'Fall detection camera'),
    t('landing_nest_bullet2', 'Environment sensors (temp, humidity, CO₂, gas)'),
    t('landing_nest_bullet3', '1 year of monitoring included'),
    t('landing_nest_bullet4', 'Account setup unlocks after payment confirmation'),
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error(t('name_required', 'First and last name are required'));
      return;
    }
    if (!form.email.trim()) {
      toast.error(t('email_required', 'Email is required'));
      return;
    }
    if (!form.dob) {
      toast.error(t('dob_required', 'Date of birth is required'));
      return;
    }
    if (!form.gender) {
      toast.error(t('gender_required', 'Please select a gender'));
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || undefined,
        national_code: form.national_code.trim() || undefined,
        dob: form.dob,
        gender: form.gender,
        plan: 'b2c_annual',
        product_sku: product?.sku ?? 'nest',
        currency,
        notes: form.notes.trim() || undefined,
      });
      setPlaced(order);
      toast.success(
        t('order_placed_toast', 'Order placed — check your email for payment & manuals'),
      );
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, t('order_failed', 'Failed to place order')));
    }
  };

  if (placed) {
    return (
      <NestShell>
        <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col justify-center px-4 py-12">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {t('order_received_eyebrow', 'Order received')}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t('order_thanks', {
                defaultValue: 'Thank you, {{name}}.',
                name: placed.first_name,
              })}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('order_email_sent', {
                defaultValue: 'We emailed a payment link and Nest manuals to {{email}}.',
                email: placed.email,
              })}
            </p>

            <div className="mt-8 border-y border-border/70 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t('order_number', 'Order #')}
              </p>
              <p className="mt-2 font-mono text-3xl font-black tracking-wider ltr-nums sm:text-4xl">
                {placed.order_number}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(
                  'order_number_hint',
                  'Save this number — after payment you will use it to set up your account.',
                )}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-base">
              <span className="text-muted-foreground">
                {t('nest_package_line', 'Senio Nest (incl. 1-year monitoring)')}
              </span>
              <span className="text-xl font-bold ltr-nums">
                €{Number(placed.total_amount).toFixed(0)}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {placed.payment_url && placed.status === 'pending_payment' && (
                <Button
                  className="h-12 flex-1 rounded-xl text-base shadow-lg shadow-primary/20"
                  onClick={() => window.location.assign(placed.payment_url!)}
                >
                  {t('pay_now', 'Pay now')}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl text-base bg-background/60"
                onClick={() => router.push(`/order-status?ref=${placed.order_number}`)}
              >
                {t('track_order', 'Track order')}
              </Button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="ghost" className="flex-1 rounded-xl" asChild>
                <Link href="/guides/nest">{t('install_guide', 'Install guide')}</Link>
              </Button>
              <Button
                variant="ghost"
                className="flex-1 rounded-xl"
                onClick={() =>
                  router.push(
                    `/auth/sign-up?order=${encodeURIComponent(placed.order_number)}`,
                  )
                }
              >
                {t('setup_account', 'Set up account')}
              </Button>
            </div>
          </div>
        </section>
      </NestShell>
    );
  }

  if (step === 'checkout') {
    return (
      <NestShell>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:py-14">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <button
              type="button"
              onClick={() => setStep('product')}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_nest', 'Back to Nest')}
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {t('checkout', 'Checkout')}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t('checkout_nest_title', 'Who is Nest for?')}
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t(
                'checkout_nest_body',
                'Enter the patient details for this Nest. After you place the order we email a payment link.',
              )}
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="first_name">{t('first_name', 'First name')} *</Label>
                  <Input
                    id="first_name"
                    required
                    className="h-11 rounded-xl"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="last_name">{t('last_name', 'Last name')} *</Label>
                  <Input
                    id="last_name"
                    required
                    className="h-11 rounded-xl"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t('email', 'Email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="h-11 rounded-xl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dob">{t('date_of_birth', 'Date of birth')} *</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    className="h-11 rounded-xl"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gender">{t('gender', 'Gender')} *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
                  >
                    <SelectTrigger id="gender" className="h-11 rounded-xl">
                      <SelectValue placeholder={t('select', 'Select…')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">{t('male', 'Male')}</SelectItem>
                      <SelectItem value="Female">{t('female', 'Female')}</SelectItem>
                      <SelectItem value="Other">{t('other', 'Other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">{t('phone', 'Phone')}</Label>
                  <Input
                    id="phone"
                    className="h-11 rounded-xl"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="nc">{t('national_code_optional', 'National code (optional)')}</Label>
                  <Input
                    id="nc"
                    className="h-11 rounded-xl"
                    value={form.national_code}
                    onChange={(e) => setForm({ ...form, national_code: e.target.value })}
                    placeholder={t('national_code_later', 'You can add this at setup')}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">{t('notes_optional', 'Notes (optional)')}</Label>
                <Input
                  id="notes"
                  className="h-11 rounded-xl"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="mt-2 h-12 w-full rounded-xl text-base shadow-lg shadow-primary/20 sm:w-auto sm:min-w-[14rem]"
              >
                {createOrder.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('place_order', 'Place order')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t(
                  'place_order_hint',
                  'After placing the order you will get an email with a payment link and Nest manuals. Paying unlocks account setup.',
                )}
              </p>
            </form>
          </div>

          <aside className="lg:sticky lg:top-24">
            <NestDeviceVisual price={price} />
            <div className="mt-5 flex items-center justify-between px-1 text-sm">
              <span className="text-muted-foreground">
                {t('nest_package_line', 'Senio Nest (incl. 1-year monitoring)')}
              </span>
              <span className="font-bold ltr-nums">€{Number(price).toFixed(0)}</span>
            </div>
          </aside>
        </section>
      </NestShell>
    );
  }

  return (
    <NestShell>
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Senio Nest
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:leading-[1.08]">
            {t('landing_nest_title', 'One home monitor. One clear package.')}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {product?.description ??
              t(
                'landing_nest_body',
                'Nest is the home edge device with a fall camera and environment sensors. The €780 package includes the hardware and a full year of SenioSentry monitoring — buy Nest before patient setup.',
              )}
          </p>

          <ul className="mt-7 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm sm:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('package_price', 'Package')}
              </p>
              <p className="text-4xl font-black tracking-tight ltr-nums">
                €{Number(price).toFixed(0)}
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 rounded-xl px-7 text-base shadow-lg shadow-primary/20"
              onClick={() => setStep('checkout')}
            >
              {t('buy_nest_cta_price', {
                defaultValue: 'Buy Senio Nest — €{{price}}',
                price: Number(price).toFixed(0),
              })}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            {t('already_paid_prefix', 'Already paid?')}{' '}
            <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
              {t('setup_account', 'Set up your account')}
            </Link>
            {' · '}
            <Link href="/order-status" className="font-semibold text-primary hover:underline">
              {t('track_order', 'Track order')}
            </Link>
          </p>
        </div>

        <div
          className={cn(
            'animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both',
          )}
        >
          <NestDeviceVisual price={price} />
        </div>
      </section>
    </NestShell>
  );
}
