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

export function AdminCaregiverRequestsPanel() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading, refetch } = useAdminCaregiverRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const respond = useRespondCaregiverRequest();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            {t('admin_caregiver_requests', 'Caregiver request tickets')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'admin_caregiver_requests_body',
              'Patients file these tickets when they need more caregivers.'
            )}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
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
                  {ticket.patient_name || ticket.patient_username || `Patient #${ticket.patient_id}`}
                </p>
                <p className="text-xs text-muted-foreground ltr-nums">
                  @{ticket.patient_username} · {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {ticket.status}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap rounded-xl bg-muted/30 p-3">
              {ticket.message}
            </p>
            {ticket.admin_response ? (
              <div className="rounded-xl border p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Response</p>
                <p className="whitespace-pre-wrap">{ticket.admin_response}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Admin response</Label>
                <Textarea
                  rows={3}
                  value={drafts[ticket.id] || ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                  }
                  placeholder="Write your response to the patient…"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={
                      respond.isPending || !(drafts[ticket.id] || '').trim()
                    }
                    onClick={async () => {
                      await respond.mutateAsync({
                        id: ticket.id,
                        response: drafts[ticket.id].trim(),
                        status: 'answered',
                      });
                      refetch();
                    }}
                  >
                    Send response
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      respond.isPending || !(drafts[ticket.id] || '').trim()
                    }
                    onClick={async () => {
                      await respond.mutateAsync({
                        id: ticket.id,
                        response: drafts[ticket.id].trim(),
                        status: 'closed',
                      });
                      refetch();
                    }}
                  >
                    Respond & close
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No tickets in this filter.</p>
        )}
      </div>
    </div>
  );
}
