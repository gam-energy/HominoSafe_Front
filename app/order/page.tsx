'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Package, CheckCircle2, ArrowRight, Camera, Shield, Thermometer } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { extractErrorMessage } from '@/features/admin/utils/adminErrors';

const FALLBACK_PRICE = 780;

function OrderShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{ paddingTop: 'calc(1rem + var(--app-sat, 0px))' }}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-50 p-4 dark:bg-zinc-950"
    >
      <div
        className="pointer-events-none absolute top-[-12%] start-[-8%] h-[42%] w-[42%] rounded-full bg-blue-100/80 blur-3xl dark:bg-blue-900/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] end-[-8%] h-[42%] w-[42%] rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-900/15"
        aria-hidden
      />
      <div
        style={{ top: 'calc(1rem + var(--app-sat, 0px))' }}
        className="absolute end-4 z-20 flex items-center gap-2"
      >
        <ModeToggle />
        <LanguageToggle />
      </div>
      <AuthBrand className="relative z-10 mb-6" />
      <div className="relative z-10 w-full flex flex-col items-center">{children}</div>
    </section>
  );
}

export default function OrderPage() {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!form.dob) {
      toast.error('Date of birth is required');
      return;
    }
    if (!form.gender) {
      toast.error('Please select a gender');
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
      toast.success('Order placed — check your email for payment & manuals');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to place order'));
    }
  };

  if (placed) {
    return (
      <OrderShell>
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Order received
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thank you, {placed.first_name}. We emailed a payment link and Nest
              manuals to <b>{placed.email}</b>.
            </p>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-1">
              <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                Order number
              </p>
              <p className="text-2xl font-black tracking-wider ltr-nums">
                {placed.order_number}
              </p>
              <p className="text-xs text-muted-foreground">
                Save this number — after payment you will use it to set up your
                account.
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Senio Nest (incl. 1-year monitoring)</span>
              <span className="font-semibold">
                €{Number(placed.total_amount).toFixed(0)}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {placed.payment_url && placed.status === 'pending_payment' && (
                <Button
                  className="flex-1 h-11"
                  onClick={() => window.location.assign(placed.payment_url!)}
                >
                  Pay now (sandbox)
                  <ArrowRight className="h-4 w-4 ms-2" />
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/order-status?ref=${placed.order_number}`)}
              >
                Track order
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="ghost" className="flex-1" asChild>
                <Link href="/guides/nest">Install manual</Link>
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  router.push(
                    `/auth/sign-up?order=${encodeURIComponent(placed.order_number)}`,
                  )
                }
              >
                Set up account
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Sandbox payment: opening the pay link and confirming marks the order
              paid. Account setup unlocks after that.
            </p>
          </CardContent>
        </Card>
      </OrderShell>
    );
  }

  return (
    <OrderShell>
      {step === 'product' ? (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border bg-muted/20 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    One model
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {product?.name ?? 'Senio Nest'}
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {product?.description ??
                      'Home edge monitor with fall camera and environment sensors. Includes 1 year of SenioSentry monitoring.'}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-3xl font-black tracking-tight ltr-nums">
                    €{Number(price).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">EUR · package</p>
                </div>
              </div>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary shrink-0" />
                  Fall detection camera
                </li>
                <li className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary shrink-0" />
                  Environment sensors
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  1 year monitoring included
                </li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You must buy Senio Nest before you can set up a patient account.
            </p>
            <Button className="w-full h-11" onClick={() => setStep('checkout')}>
              Buy Senio Nest — €{Number(price).toFixed(0)}
              <ArrowRight className="h-4 w-4 ms-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already paid?{' '}
              <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
                Set up your account
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Checkout — Senio Nest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="first_name">First name *</Label>
                  <Input
                    id="first_name"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="last_name">Last name *</Label>
                  <Input
                    id="last_name"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="dob">Date of birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="nc">National code (optional)</Label>
                  <Input
                    id="nc"
                    value={form.national_code}
                    onChange={(e) => setForm({ ...form, national_code: e.target.value })}
                    placeholder="You can add this at setup"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Senio Nest package</span>
                  <span className="font-semibold">€{Number(price).toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Includes device + 1 year of monitoring. No separate subscription charge.
                </p>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>€{Number(price).toFixed(0)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('product')}>
                  Back
                </Button>
                <Button type="submit" disabled={createOrder.isPending} className="flex-1 h-11">
                  {createOrder.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  Place order
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                After placing the order you will get an email with a sandbox payment
                link and Nest manuals. Paying unlocks account setup.
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </OrderShell>
  );
}
