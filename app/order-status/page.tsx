'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyOrder, type OrderStatus } from '@/features/orders/api/use-orders';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid — preparing shipment',
  shipped: 'Shipped',
  delivered: 'Delivered',
  activated: 'Activated',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_STEPS: OrderStatus[] = [
  'pending_payment',
  'paid',
  'shipped',
  'delivered',
  'activated',
];

function StatusInner() {
  const sp = useSearchParams();
  const initial = sp.get('ref') || '';
  const [ref, setRef] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);

  const { data, isLoading, error } = useMyOrder(submitted || null);

  return (
    <section className="w-full min-h-screen flex flex-col justify-center items-center bg-secondary p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Track your order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(ref);
            }}
            className="flex gap-2"
          >
            <div className="flex-1 grid gap-1.5">
              <Label htmlFor="ref" className="sr-only">
                Order number
              </Label>
              <Input
                id="ref"
                placeholder="SO-XXXXXXXX-XXXXXX"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 me-1" />
              Track
            </Button>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 me-2 animate-spin" />
              Looking up…
            </div>
          )}

          {error && !isLoading && (
            <p className="text-sm text-rose-500 text-center">
              Order not found. Check your order number.
            </p>
          )}

          {data && !isLoading && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Order number
                </p>
                <p className="text-xl font-black tracking-wider ltr-nums">
                  {data.order_number}
                </p>
              </div>
              <ol className="space-y-3">
                {STATUS_STEPS.map((step, i) => {
                  const currentIdx = STATUS_STEPS.indexOf(data.status);
                  const done = i <= currentIdx;
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <div
                        className={
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ' +
                          (done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-muted text-muted-foreground')
                        }
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={done ? 'font-semibold' : 'text-muted-foreground'}>
                        {STATUS_LABELS[step]}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">
                  €{data.total_amount.toFixed(0)} {data.currency}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <StatusInner />
    </Suspense>
  );
}
