import axiosInstance from '@/api/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'activated'
  | 'cancelled'
  | 'refunded';

export type SubscriptionPlan = 'b2c_annual' | 'b2c_monthly';
export type SubscriptionStatus = 'pending_activation' | 'active' | 'expired' | 'cancelled';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';
export type Gender = 'Male' | 'Female' | 'Other';

export interface CustomerOrder {
  id: number;
  order_number: string;
  user_id?: number | null;
  email: string;
  phone_number?: string | null;
  first_name: string;
  last_name: string;
  national_code?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  subscription_amount: number;
  subscription_plan: SubscriptionPlan;
  device_amount: number;
  currency: string;
  total_amount: number;
  status: OrderStatus;
  paid_at?: string | null;
  delivery_deadline_at?: string | null;
  activated_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  email: string;
  first_name: string;
  last_name: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  user_id?: number | null;
}

export interface Shipment {
  id: number;
  order_id: number;
  status: ShipmentStatus;
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Subscription {
  id: number;
  order_id: number;
  user_id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date?: string | null;
  end_date?: string | null;
  amount: number;
  currency: string;
  days_remaining: number;
}

export interface OrderCreatePayload {
  email: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
  national_code?: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  plan?: SubscriptionPlan;
  device_amount?: number;
  currency?: string;
  notes?: string;
}

export interface OrderUpdatePayload {
  status?: OrderStatus;
  device_amount?: number;
  subscription_amount?: number;
  currency?: string;
  notes?: string;
  mark_paid?: boolean;
}

export interface ShipmentCreatePayload {
  order_id: number;
  carrier?: string;
  tracking_number?: string;
  address?: string;
  notes?: string;
}

export interface ShipmentUpdatePayload {
  status?: ShipmentStatus;
  carrier?: string;
  tracking_number?: string;
  address?: string;
  notes?: string;
}

// ---------------- Public ---------------- //

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: OrderCreatePayload) => {
      const { data } = await axiosInstance.post<CustomerOrder>('/orders', payload);
      return data;
    },
  });
}

export function useMyOrder(orderNumber: string | null) {
  return useQuery({
    queryKey: ['public-order', orderNumber],
    enabled: !!orderNumber,
    queryFn: async () => {
      const { data } = await axiosInstance.get<CustomerOrder>(`/orders/${orderNumber}`);
      return data;
    },
  });
}

// ---------------- Admin: orders ---------------- //

export function useAdminOrders(params?: { status?: OrderStatus; search?: string }) {
  const query = params as Record<string, string | undefined>;
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<OrderSummary[]>('/admin/orders', {
        params: query,
      });
      return data;
    },
  });
}

export function useAdminOrder(id?: number) {
  return useQuery({
    queryKey: ['admin-order', id],
    enabled: typeof id === 'number',
    queryFn: async () => {
      const { data } = await axiosInstance.get<CustomerOrder>(`/admin/orders/${id}`);
      return data;
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: OrderUpdatePayload }) => {
      const { data } = await axiosInstance.patch<CustomerOrder>(
        `/admin/orders/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
}

export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axiosInstance.post<CustomerOrder>(
        `/admin/orders/${id}/mark-paid`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
}

// ---------------- Admin: shipments ---------------- //

export function useAdminShipments(orderId?: number) {
  return useQuery({
    queryKey: ['admin-shipments', orderId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Shipment[]>('/admin/shipments', {
        params: orderId ? { order_id: orderId } : undefined,
      });
      return data;
    },
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ShipmentCreatePayload) => {
      const { data } = await axiosInstance.post<Shipment>('/admin/shipments', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shipments'] }),
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ShipmentUpdatePayload }) => {
      const { data } = await axiosInstance.patch<Shipment>(`/admin/shipments/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shipments'] }),
  });
}

// ---------------- Customer: subscription + claim ---------------- //

export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Subscription | null>('/me/subscription');
      return data;
    },
  });
}

export function useClaimRecord() {
  return useMutation({
    mutationFn: async (payload: { national_code: string; dob: string }) => {
      const { data } = await axiosInstance.post<{
        matched: boolean;
        message: string;
        record_user_id?: number | null;
        has_ehr: boolean;
      }>('/me/claim-record', payload);
      return data;
    },
  });
}
