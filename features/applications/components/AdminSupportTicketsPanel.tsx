'use client';

import { useState } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCaregiverRequests,
  useRespondCaregiverRequest,
} from '../api/use-applications';
import { SUPPORT_TICKET_CATEGORIES } from '../types/applications';

function categoryLabel(value?: string | null) {
  return (
    SUPPORT_TICKET_CATEGORIES.find((c) => c.value === value)?.label ||
    value ||
    'Support'
  );
}

export function AdminSupportTicketsPanel() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data, isLoading, refetch } = useAdminCaregiverRequests(
    statusFilter === 'all' ? undefined : statusFilter,
    categoryFilter === 'all' ? undefined : categoryFilter
  );
  const respond = useRespondCaregiverRequest();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            {t('admin_support_tickets', 'Support tickets')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'admin_support_tickets_body',
              'Answer caregiver requests, billing questions, Nest issues, and other user tickets.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_categories', 'All categories')}</SelectItem>
              {SUPPORT_TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(`ticket_cat_${c.value}`, c.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      <div className="space-y-4">
        {(data ?? []).map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {ticket.patient_name ||
                    ticket.patient_username ||
                    `User #${ticket.patient_id}`}
                </p>
                <p className="text-xs text-muted-foreground ltr-nums">
                  @{ticket.patient_username} ·{' '}
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {t(
                    `ticket_cat_${ticket.category || 'other'}`,
                    categoryLabel(ticket.category)
                  )}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ticket.status}
                </span>
              </div>
            </div>
            {ticket.subject ? (
              <p className="text-sm font-semibold">{ticket.subject}</p>
            ) : null}
            <p className="text-sm whitespace-pre-wrap rounded-xl bg-muted/30 p-3">
              {ticket.message}
            </p>
            {ticket.admin_response ? (
              <div className="rounded-xl border p-3 text-sm space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('admin_response', 'Admin response')}
                </p>
                <p className="whitespace-pre-wrap">{ticket.admin_response}</p>
                <div className="space-y-2 pt-2 border-t">
                  <Label>{t('update_response', 'Update response')}</Label>
                  <Textarea
                    rows={3}
                    value={drafts[ticket.id] ?? ticket.admin_response}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={
                        respond.isPending || !(drafts[ticket.id] || ticket.admin_response || '').trim()
                      }
                      onClick={async () => {
                        await respond.mutateAsync({
                          id: ticket.id,
                          response: (drafts[ticket.id] ?? ticket.admin_response!).trim(),
                          status: 'answered',
                        });
                        refetch();
                      }}
                    >
                      {t('update_answer', 'Update answer')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        respond.isPending || !(drafts[ticket.id] || ticket.admin_response || '').trim()
                      }
                      onClick={async () => {
                        await respond.mutateAsync({
                          id: ticket.id,
                          response: (drafts[ticket.id] ?? ticket.admin_response!).trim(),
                          status: 'closed',
                        });
                        refetch();
                      }}
                    >
                      {t('close_ticket', 'Close ticket')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('admin_response', 'Admin response')}</Label>
                <Textarea
                  rows={3}
                  value={drafts[ticket.id] || ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                  }
                  placeholder={t(
                    'admin_response_ph',
                    'Write your response to the user…'
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={respond.isPending || !(drafts[ticket.id] || '').trim()}
                    onClick={async () => {
                      await respond.mutateAsync({
                        id: ticket.id,
                        response: drafts[ticket.id].trim(),
                        status: 'in_review',
                      });
                      refetch();
                    }}
                  >
                    {t('mark_in_review', 'Save & mark in review')}
                  </Button>
                  <Button
                    size="sm"
                    disabled={respond.isPending || !(drafts[ticket.id] || '').trim()}
                    onClick={async () => {
                      await respond.mutateAsync({
                        id: ticket.id,
                        response: drafts[ticket.id].trim(),
                        status: 'answered',
                      });
                      refetch();
                    }}
                  >
                    {t('send_response', 'Send response')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respond.isPending || !(drafts[ticket.id] || '').trim()}
                    onClick={async () => {
                      await respond.mutateAsync({
                        id: ticket.id,
                        response: drafts[ticket.id].trim(),
                        status: 'closed',
                      });
                      refetch();
                    }}
                  >
                    {t('respond_and_close', 'Respond & close')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('no_tickets_filter', 'No tickets in this filter.')}
          </p>
        )}
      </div>
    </div>
  );
}
