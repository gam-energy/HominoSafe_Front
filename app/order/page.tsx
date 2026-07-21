'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, CheckCircle2, ArrowRight } from 'lucide-react';
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
import { useCreateOrder, type CustomerOrder, type Gender } from '@/features/orders/api/use-orders';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

const ANNUAL_PRICE = 780;
const DEVICE_PRICE = 0; // admin records the Nest price per order

export default function OrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();
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
    if (!form.gender) {
      toast.error('Please select a gender');
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        national_code: form.national_code || undefined,
        dob: form.dob,
        gender: form.gender,
        plan: 'b2c_annual',
        device_amount: DEVICE_PRICE,
        currency: 'EUR',
        notes: form.notes || undefined,
      });
      setPlaced(order);
      toast.success('Order placed');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to place order');
    }
  };

  if (placed) {
    return (
      <section
        style={{ paddingTop: 'calc(1rem + var(--app-sat, 0px))' }}
        className="w-full min-h-screen flex flex-col justify-center items-center bg-secondary p-4 relative"
      >
        <div
          style={{ top: 'calc(1rem + var(--app-sat, 0px))' }}
          className="absolute end-4 z-20 flex items-center gap-2"
        >
          <ModeToggle />
          <LanguageToggle />
        </div>
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Order received
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thank you, {placed.first_name}. Your order has been received. We will email
              payment instructions and shipping updates to <b>{placed.email}</b>.
            </p>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-1">
              <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                Order number
              </p>
              <p className="text-2xl font-black tracking-wider ltr-nums">
                {placed.order_number}
              </p>
              <p className="text-xs text-muted-foreground">
                Save this number — you can use it to track your order anytime.
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscription (1 year)</span>
              <span className="font-semibold">€{placed.subscription_amount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nest device</span>
              <span className="font-semibold">
                {placed.device_amount > 0
                  ? `€${placed.device_amount.toFixed(0)}`
                  : 'Quoted separately'}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <span>Total</span>
              <span>€{placed.total_amount.toFixed(0)}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => router.push(`/order-status?ref=${placed.order_number}`)}
            >
              Track order
              <ArrowRight className="h-4 w-4 ms-2" />
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section
      style={{ paddingTop: 'calc(1rem + var(--app-sat, 0px))' }}
      className="w-full min-h-screen flex flex-col justify-center items-center bg-secondary p-4 relative"
    >
      <div
        style={{ top: 'calc(1rem + var(--app-sat, 0px))' }}
        className="absolute end-4 z-20 flex items-center gap-2"
      >
        <ModeToggle />
        <LanguageToggle />
      </div>
      <h1 className="relative hidden sm:block text-5xl font-extrabold text-white drop-shadow-md tracking-wide mb-2">
        SenioSentry
      </h1>
      <p className="sm:hidden mb-2 text-lg font-bold text-white">SenioSentry</p>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Order Nest + 1-year subscription
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
                <Label htmlFor="nc">National / Social Security code</Label>
                <Input
                  id="nc"
                  value={form.national_code}
                  onChange={(e) => setForm({ ...form, national_code: e.target.value })}
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
                <span className="text-muted-foreground">1-year subscription</span>
                <span className="font-semibold">€{ANNUAL_PRICE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nest device</span>
                <span className="font-semibold">Quoted separately</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total today</span>
                <span>€{ANNUAL_PRICE}</span>
              </div>
            </div>

            <Button type="submit" disabled={createOrder.isPending} className="w-full h-11">
              {createOrder.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Place order
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Payment is confirmed manually by our team. Your subscription starts when your
              Nest is activated (or 30 days after delivery).
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
