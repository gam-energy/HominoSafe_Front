'use client';

import { useState } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useCreateCaregiverRequest,
  useMyCaregiverRequests,
} from '../api/use-applications';

export function CaregiverRequestPanel() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useMyCaregiverRequests();
  const create = useCreateCaregiverRequest();
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return;
    await create.mutateAsync(message.trim());
    setMessage('');
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          {t('caregiver_request_title', 'Request a caregiver')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'caregiver_request_body',
            'File a ticket if you need additional caregivers. An admin will respond here.'
          )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cg_req_msg">{t('your_message', 'Your message')}</Label>
          <Textarea
            id="cg_req_msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t(
              'caregiver_request_placeholder',
              'Explain who you need as a caregiver and any details for the admin…'
            )}
            minLength={10}
            required
          />
        </div>
        <Button type="submit" disabled={create.isPending || message.trim().length < 10}>
          {create.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {t('submit_ticket', 'Submit ticket')}
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('your_tickets', 'Your tickets')}
        </h2>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading…')}
          </div>
        )}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('no_caregiver_tickets', 'No caregiver requests yet.')}
          </p>
        )}
        {(data ?? []).map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {ticket.status}
              </span>
              <span className="text-xs text-muted-foreground ltr-nums">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
            {ticket.admin_response && (
              <div className="rounded-xl bg-muted/40 border p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {t('admin_response', 'Admin response')}
                </p>
                <p className="whitespace-pre-wrap">{ticket.admin_response}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
