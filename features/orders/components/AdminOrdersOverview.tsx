'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Package,
  Search,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  useAdminOrders,
  useAdminOrder,
  useMarkOrderPaid,
  useUpdateOrder,
  useAdminShipments,
  useCreateShipment,
  useUpdateShipment,
  type OrderStatus,
  type OrderSummary,
  type ShipmentStatus,
} from '@/features/orders/api/use-orders';

const STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'shipped',
  'delivered',
  'activated',
  'cancelled',
  'refunded',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  activated: 'Activated',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-500/10 text-amber-600',
  paid: 'bg-sky-500/10 text-sky-600',
  shipped: 'bg-violet-500/10 text-violet-600',
  delivered: 'bg-blue-500/10 text-blue-600',
  activated: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-rose-500/10 text-rose-600',
  refunded: 'bg-zinc-500/10 text-zinc-600',
};

export function AdminOrdersOverview() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      status: statusFilter !== 'all' ? (statusFilter as OrderStatus) : undefined,
      search: q.trim() || undefined,
    }),
    [q, statusFilter],
  );

  const { data, isLoading } = useAdminOrders(params);

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5" />
          B2C Orders
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search email, name, order #"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 me-2 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <div className="divide-y">
              {rows.map((r: OrderSummary) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {r.first_name} {r.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    <p className="text-xs text-muted-foreground ltr-nums">{r.order_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold ltr-nums">
                      €{r.total_amount.toFixed(0)}
                    </span>
                    <span
                      className={
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ' +
                        STATUS_COLORS[r.status]
                      }
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId !== null && (
        <OrderDetailDialog orderId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useAdminOrder(orderId);
  const markPaid = useMarkOrderPaid();
  const updateOrder = useUpdateOrder();
  const [deviceAmount, setDeviceAmount] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');

  const shipmentsQ = useAdminShipments(orderId);
  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();

  const onMarkPaid = async () => {
    try {
      await markPaid.mutateAsync(orderId);
      toast.success('Order marked paid — user account provisioned');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    }
  };

  const onSave = async () => {
    try {
      await updateOrder.mutateAsync({
        id: orderId,
        payload: {
          device_amount: deviceAmount ? Number(deviceAmount) : undefined,
          status: status || undefined,
        },
      });
      toast.success('Order updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    }
  };

  const onCreateShipment = async () => {
    try {
      await createShipment.mutateAsync({ order_id: orderId });
      toast.success('Shipment created');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order detail</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Order #</p>
                <p className="font-mono font-bold">{data.order_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Status</p>
                <span
                  className={
                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ' +
                    STATUS_COLORS[data.status]
                  }
                >
                  {STATUS_LABELS[data.status]}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Customer</p>
                <p className="font-semibold">
                  {data.first_name} {data.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{data.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">National code</p>
                <p className="font-semibold">{data.national_code || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Subscription</p>
                <p className="font-semibold">€{data.subscription_amount.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Device</p>
                <p className="font-semibold">
                  {data.device_amount > 0
                    ? `€${data.device_amount.toFixed(0)}`
                    : 'Not quoted'}
                </p>
              </div>
              {data.user_id && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Account</p>
                  <p className="font-semibold">User #{data.user_id}</p>
                </div>
              )}
            </div>

            {data.status === 'pending_payment' && (
              <Button onClick={onMarkPaid} disabled={markPaid.isPending} className="w-full">
                <CheckCircle2 className="h-4 w-4 me-2" />
                Mark paid & provision account
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="dev-amt">Device amount (€)</Label>
                <Input
                  id="dev-amt"
                  type="number"
                  value={deviceAmount}
                  onChange={(e) => setDeviceAmount(e.target.value)}
                  placeholder={String(data.device_amount || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="st">Set status</Label>
                <Select
                  value={status || data.status}
                  onValueChange={(v) => setStatus(v as OrderStatus)}
                >
                  <SelectTrigger id="st">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={onSave} variant="outline" className="w-full">
              Save changes
            </Button>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipments
                </h4>
                <Button size="sm" variant="outline" onClick={onCreateShipment}>
                  Add shipment
                </Button>
              </div>
              {shipmentsQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (shipmentsQ.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No shipments yet.</p>
              ) : (
                <div className="space-y-2">
                  {(shipmentsQ.data ?? []).map((s) => (
                    <ShipmentRow
                      key={s.id}
                      shipment={s}
                      onUpdate={(payload) =>
                        updateShipment.mutateAsync({ id: s.id, payload })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShipmentRow({
  shipment,
  onUpdate,
}: {
  shipment: import('@/features/orders/api/use-orders').Shipment;
  onUpdate: (payload: import('@/features/orders/api/use-orders').ShipmentUpdatePayload) => Promise<any>;
}) {
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status);
  const [carrier, setCarrier] = useState(shipment.carrier || '');
  const [tracking, setTracking] = useState(shipment.tracking_number || '');

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Select value={status} onValueChange={(v) => setStatus(v as ShipmentStatus)}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="text-xs"
        />
        <Input
          placeholder="Tracking #"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="text-xs"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() =>
          onUpdate({
            status,
            carrier: carrier || undefined,
            tracking_number: tracking || undefined,
          })
        }
      >
        Save shipment
      </Button>
    </div>
  );
}
