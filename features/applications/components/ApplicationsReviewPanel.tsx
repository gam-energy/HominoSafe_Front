'use client';

import { useMemo, useState } from 'react';
import {
  Loader2,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Banknote,
  ClipboardList,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchPaymentReceiptBlob,
  useApplicationsReview,
  usePatchApplication,
} from '../api/use-applications';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type ApplicationSummary,
} from '../types/applications';
import {
  formatDateTime,
  formatMoney,
  personDisplayName,
} from '../utils/applications';

type DialogMode = 'payment' | 'reject' | 'preview' | null;

export function ApplicationsReviewPanel() {
  const { t } = useTranslation();
  const { user, role } = useUser();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const reviewStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { data, isLoading, isError, refetch, isFetching } =
    useApplicationsReview(reviewStatus);
  const patch = usePatchApplication();

  const [selected, setSelected] = useState<ApplicationSummary | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [currency, setCurrency] = useState('IRR');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const allowed = role === 'clinic_admin' || role === 'admin';

  const rows = useMemo(() => data ?? [], [data]);

  if (user && !allowed) {
    return (
      <div className="rounded-xl border p-6 text-center text-muted-foreground">
        {t('unauthorized', 'You do not have access to this page.')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const openPayment = (app: ApplicationSummary) => {
    setSelected(app);
    setPaymentAmount(app.payment_amount != null ? String(app.payment_amount) : '');
    setCurrency(app.currency || 'IRR');
    setPaymentInstructions(app.payment_instructions || '');
    setDialog('payment');
  };

  const openReject = (app: ApplicationSummary) => {
    setSelected(app);
    setRejectNote('');
    setDialog('reject');
  };

  const closeDialog = () => {
    setDialog(null);
    if (receiptUrl) {
      URL.revokeObjectURL(receiptUrl);
      setReceiptUrl(null);
    }
  };

  const runAction = async (
    app: ApplicationSummary,
    action: 'under_review' | 'approve'
  ) => {
    try {
      await patch.mutateAsync({ id: app.id, payload: { action } });
      refetch();
    } catch {
      // toasted
    }
  };

  const submitPaymentRequest = async () => {
    if (!selected) return;
    const amount = Number(paymentAmount);
    if (!paymentAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error(t('err_payment_amount', 'Enter a valid payment amount'));
      return;
    }
    if (!paymentInstructions.trim()) {
      toast.error(t('err_payment_instructions', 'Payment instructions are required'));
      return;
    }
    try {
      await patch.mutateAsync({
        id: selected.id,
        payload: {
          action: 'request_payment',
          payment_amount: amount,
          currency: currency.trim() || 'IRR',
          payment_instructions: paymentInstructions.trim(),
        },
      });
      closeDialog();
      refetch();
    } catch {
      // toasted
    }
  };

  const submitReject = async () => {
    if (!selected) return;
    if (!rejectNote.trim()) {
      toast.error(t('err_reject_reason', 'A rejection reason is required'));
      return;
    }
    try {
      await patch.mutateAsync({
        id: selected.id,
        payload: {
          action: 'reject',
          reason: rejectNote.trim(),
          note: rejectNote.trim(),
        },
      });
      closeDialog();
      refetch();
    } catch {
      // toasted
    }
  };

  const previewReceipt = async (app: ApplicationSummary) => {
    setSelected(app);
    setDialog('preview');
    setReceiptLoading(true);
    try {
      const blob = await fetchPaymentReceiptBlob(app.id);
      const url = URL.createObjectURL(blob);
      setReceiptUrl(url);
    } catch {
      toast.error(t('err_load_receipt', 'Could not load receipt'));
      closeDialog();
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadReceipt = async (app: ApplicationSummary) => {
    try {
      const blob = await fetchPaymentReceiptBlob(app.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        app.receipt_name || app.receipt?.filename || `receipt-${app.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('err_load_receipt', 'Could not load receipt'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('applications', 'Applications')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'applications_desc',
              'Review caregiver applications, request payment, and approve access.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filter_status', 'Filter status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_statuses', 'All statuses')}</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`app_status_${s}`, s.replace(/_/g, ' '))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 p-6">
          <p className="text-destructive">
            {t('err_load_applications', 'Could not load applications.')}
          </p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            {t('try_again', 'Try again')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          {t('no_applications', 'No applications found.')}
        </div>
      )}

      <div className="grid gap-4">
        {rows.map((app) => (
          <article
            key={app.id}
            className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">
                    {personDisplayName(app.caregiver)}
                  </h2>
                  <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('patient', 'Patient')}: {personDisplayName(app.patient)}
                  {app.patient?.national_code ? ` · ${app.patient.national_code}` : ''}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t('clinic', 'Clinic')}: {app.clinic?.name ?? '—'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('submitted', 'Submitted')}:{' '}
                  {formatDateTime(app.submitted_at || app.created_at)}
                </p>
              </div>
              {(app.payment_amount != null || app.has_receipt || app.receipt) && (
                <div className="text-end text-sm">
                  {app.payment_amount != null && (
                    <p className="font-semibold">
                      {formatMoney(app.payment_amount, app.currency)}
                    </p>
                  )}
                  {(app.has_receipt || app.receipt) && (
                    <p className="text-muted-foreground">
                      {t('receipt_on_file', 'Receipt on file')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {app.status === 'submitted' && (
                <Button
                  size="sm"
                  onClick={() => runAction(app, 'under_review')}
                  disabled={patch.isPending}
                >
                  <ClipboardList className="me-1.5 h-4 w-4" />
                  {t('start_review', 'Start review')}
                </Button>
              )}
              {(app.status === 'under_review' || app.status === 'submitted') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openPayment(app)}
                  disabled={patch.isPending}
                >
                  <Banknote className="me-1.5 h-4 w-4" />
                  {t('request_payment', 'Request payment')}
                </Button>
              )}
              {(app.status === 'payment_submitted' ||
                app.status === 'payment_pending') && (
                <Button
                  size="sm"
                  onClick={() => runAction(app, 'approve')}
                  disabled={patch.isPending}
                >
                  <CheckCircle2 className="me-1.5 h-4 w-4" />
                  {t('approve_payment', 'Approve payment')}
                </Button>
              )}
              {app.status !== 'approved' && app.status !== 'rejected' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openReject(app)}
                  disabled={patch.isPending}
                >
                  <XCircle className="me-1.5 h-4 w-4" />
                  {t('reject', 'Reject')}
                </Button>
              )}
              {(app.has_receipt || app.receipt || app.status === 'payment_submitted') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => previewReceipt(app)}
                  >
                    <Eye className="me-1.5 h-4 w-4" />
                    {t('preview_receipt', 'Preview receipt')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReceipt(app)}
                  >
                    <Download className="me-1.5 h-4 w-4" />
                    {t('download_receipt', 'Download')}
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={dialog === 'payment'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('request_payment', 'Request payment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay_amount">{t('amount', 'Amount')}</Label>
              <Input
                id="pay_amount"
                dir="ltr"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay_currency">{t('currency', 'Currency')}</Label>
              <Input
                id="pay_currency"
                dir="ltr"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="IRR"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay_instr">
                {t('payment_instructions', 'Payment instructions')}
              </Label>
              <Textarea
                id="pay_instr"
                rows={4}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={submitPaymentRequest} disabled={patch.isPending}>
              {patch.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('send_request', 'Send request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'reject'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reject_application', 'Reject application')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="reject_note">{t('rejection_reason', 'Reason')}</Label>
            <Textarea
              id="reject_note"
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={patch.isPending}
            >
              {patch.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('confirm_reject', 'Confirm reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'preview'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('preview_receipt', 'Preview receipt')}</DialogTitle>
          </DialogHeader>
          <div className="min-h-[240px] py-2">
            {receiptLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!receiptLoading && receiptUrl && (() => {
              const isPdf =
                selected?.receipt?.content_type?.includes('pdf') ||
                selected?.receipt?.filename?.toLowerCase().endsWith('.pdf');
              if (isPdf) {
                return (
                  <iframe
                    title="Receipt PDF"
                    src={receiptUrl}
                    className="h-[70vh] w-full rounded-lg border"
                  />
                );
              }
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receiptUrl}
                  alt="Payment receipt"
                  className="mx-auto max-h-[70vh] rounded-lg border object-contain"
                />
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t('close', 'Close')}
            </Button>
            {selected && (
              <Button onClick={() => downloadReceipt(selected)}>
                <Download className="me-1.5 h-4 w-4" />
                {t('download_receipt', 'Download')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
