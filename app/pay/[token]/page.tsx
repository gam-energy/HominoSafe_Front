'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, CreditCard, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import {
  useConfirmSandboxPayment,
  usePaymentCheckout,
} from '@/features/orders/api/use-orders';
import { extractErrorMessage } from '@/features/admin/utils/adminErrors';

export default function SandboxPayPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === 'string' ? params.token : '';
  const router = useRouter();
  const checkout = usePaymentCheckout(token || null);
  const confirmM = useConfirmSandboxPayment();
  const [done, setDone] = useState(false);

  const onPay = async () => {
    if (!token) return;
    try {
      const res = await confirmM.mutateAsync(token);
      toast.success(res.message);
      setDone(true);
      checkout.refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Payment failed'));
    }
  };

  const data = checkout.data;
  const paid = done || data?.already_paid;

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-50 p-4 dark:bg-zinc-950">
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2">
        <ModeToggle />
        <LanguageToggle />
      </div>
      <AuthBrand className="relative z-10 mb-6" />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <CreditCard className="h-5 w-5 text-primary" />
            )}
            {paid ? 'Payment confirmed' : 'Senio Nest — sandbox payment'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkout.isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {checkout.isError && (
            <p className="text-sm text-destructive">
              This payment link is invalid or expired.
            </p>
          )}
          {data && (
            <>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order</span>{' '}
                  <b className="ltr-nums">{data.order_number}</b>
                </p>
                <p>
                  <span className="text-muted-foreground">Name</span>{' '}
                  {data.first_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Email</span>{' '}
                  {data.email}
                </p>
                <p className="pt-2 text-lg font-bold">
                  €{Number(data.total_amount).toFixed(0)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {data.currency}
                  </span>
                </p>
              </div>

              {!paid ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    MVP sandbox: clicking Pay marks this order as paid. No real
                    card charge.
                  </p>
                  <Button
                    className="w-full h-11"
                    onClick={onPay}
                    disabled={confirmM.isPending}
                  >
                    {confirmM.isPending && (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    )}
                    Pay €{Number(data.total_amount).toFixed(0)} now
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    You can set up your patient account with order number{' '}
                    <b className="ltr-nums">{data.order_number}</b>.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(
                        data.setup_url ||
                          `/auth/sign-up?order=${encodeURIComponent(data.order_number)}`,
                      )
                    }
                  >
                    Set up account
                  </Button>
                </>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href={data.manual_url || '/guides/nest'}>
                  <BookOpen className="h-4 w-4 me-2" />
                  Nest install manual
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
