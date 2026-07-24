'use client';

import { useMemo, useState } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useCreateCaregiverRequest,
  useMyCaregiverRequests,
} from '../api/use-applications';
import {
  SUPPORT_TICKET_CATEGORIES,
  type SupportTicketCategory,
} from '../types/applications';

function categoryLabel(value?: string | null) {
  return (
    SUPPORT_TICKET_CATEGORIES.find((c) => c.value === value)?.label ||
    value ||
    'Support'
  );
}

export function SupportTicketsPanel() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') ||
    'caregiver_request') as SupportTicketCategory;

  const [category, setCategory] = useState<SupportTicketCategory>(
    SUPPORT_TICKET_CATEGORIES.some((c) => c.value === initialCategory)
      ? initialCategory
      : 'caregiver_request'
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [listFilter, setListFilter] = useState<string>('all');

  const { data, isLoading, refetch } = useMyCaregiverRequests(
    listFilter === 'all' ? undefined : listFilter
  );
  const create = useCreateCaregiverRequest();

  const placeholders = useMemo(
    () =>
      ({
        caregiver_request: t(
          'ticket_ph_caregiver',
          'Who do you need as a caregiver, and any details for the admin…'
        ),
        billing: t('ticket_ph_billing', 'Describe the billing or payment issue…'),
        technical: t('ticket_ph_technical', 'What went wrong? Include steps to reproduce…'),
        account: t('ticket_ph_account', 'Describe the account or login problem…'),
        nest_device: t(
          'ticket_ph_nest',
          'Describe the Nest device, install, or sensor issue…'
        ),
        medical_data: t(
          'ticket_ph_medical',
          'What medical data looks wrong or missing?'
        ),
        other: t('ticket_ph_other', 'How can we help?'),
      }) as Record<SupportTicketCategory, string>,
    [t]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return;
    await create.mutateAsync({
      category,
      subject: subject.trim() || undefined,
      message: message.trim(),
    });
    setMessage('');
    setSubject('');
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          {t('support_tickets_title', 'Support tickets')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'support_tickets_body',
            'Choose a category and file a ticket. A system admin will answer here.'
          )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>{t('ticket_category', 'Category')}</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as SupportTicketCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(`ticket_cat_${c.value}`, c.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket_subject">{t('subject', 'Subject')}</Label>
          <Input
            id="ticket_subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('ticket_subject_ph', 'Short summary (optional)')}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket_msg">{t('your_message', 'Your message')}</Label>
          <Textarea
            id="ticket_msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={placeholders[category]}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('your_tickets', 'Your tickets')}
          </h2>
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-44 h-8">
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
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading…')}
          </div>
        )}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('no_support_tickets', 'No support tickets yet.')}
          </p>
        )}
        {(data ?? []).map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
              <span className="text-xs text-muted-foreground ltr-nums">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            {ticket.subject ? (
              <p className="text-sm font-semibold">{ticket.subject}</p>
            ) : null}
            <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
            {ticket.admin_response && (
              <div className="rounded-xl bg-muted/40 border p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {t('admin_response', 'Admin response')}
                </p>
                <p className="whitespace-pre-wrap">{ticket.admin_response}</p>
                {ticket.responded_at ? (
                  <p className="mt-2 text-xs text-muted-foreground ltr-nums">
                    {new Date(ticket.responded_at).toLocaleString()}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
