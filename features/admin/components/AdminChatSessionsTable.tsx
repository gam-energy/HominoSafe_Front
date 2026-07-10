'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, Eye, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useGetChatSessions } from '../api/use-get-chat-sessions';
import { useArchiveChatSession } from '../api/use-archive-chat-session';
import type { AdminChatSession } from '../types/admin';

const PAGE_SIZE = 50;

function statusBadgeClass(status: string): string {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (s === 'ARCHIVED') {
    return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
  return 'bg-muted text-muted-foreground';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function AdminChatSessionsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise filters from URL so deep links (e.g. from user detail) work.
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | ''>(
    (searchParams.get('status') as 'active' | 'archived' | '') || '',
  );
  const [userIdInput, setUserIdInput] = useState(searchParams.get('user_id') || '');
  const [patientIdInput, setPatientIdInput] = useState(
    searchParams.get('patient_id') || '',
  );
  const [skip, setSkip] = useState(0);
  const [archiveTarget, setArchiveTarget] = useState<AdminChatSession | null>(
    null,
  );

  // Reset to first page whenever filters change.
  useEffect(() => {
    setSkip(0);
  }, [statusFilter, userIdInput, patientIdInput]);

  const userIdNum = userIdInput.trim() ? Number(userIdInput) : undefined;
  const patientIdNum = patientIdInput.trim()
    ? Number(patientIdInput)
    : undefined;

  const { data, isLoading, error, isFetching } = useGetChatSessions({
    user_id: Number.isFinite(userIdNum) ? userIdNum : undefined,
    patient_id: Number.isFinite(patientIdNum) ? patientIdNum : undefined,
    status: statusFilter || undefined,
    skip,
    limit: PAGE_SIZE,
  });

  const archiveMutation = useArchiveChatSession();

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const hasMore = skip + sessions.length < total;
  const hasPrev = skip > 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">AI chat sessions</h1>
        <p className="text-sm text-muted-foreground">
          Audit any user's chatbot conversations. Archive to hide from active
          lists.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              className="border-input h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'active' | 'archived' | '')
              }
            >
              <option value="">Both</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              User ID
            </label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 12"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Patient ID
            </label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 1"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Sessions{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({total} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              {error.message}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No chat sessions match these filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 text-center">User</th>
                    <th className="px-4 py-3 text-center">Patient</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Last message</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {s.title || (
                            <span className="text-muted-foreground">
                              Untitled session
                            </span>
                          )}
                        </div>
                        <code className="text-xs text-muted-foreground">
                          {s.id}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.user_id != null ? (
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() =>
                              router.push(`/dashboard/users/${s.user_id}`)
                            }
                          >
                            #{s.user_id}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.patient_id != null ? `#${s.patient_id}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={statusBadgeClass(s.status)}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(s.last_message_at || s.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              router.push(`/dashboard/chat-sessions/${s.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          {(s.status || '').toLowerCase() === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-amber-600 hover:text-amber-700"
                              onClick={() => setArchiveTarget(s)}
                            >
                              <Archive className="h-4 w-4" /> Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(hasPrev || hasMore) && (
            <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev || isFetching}
                onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                {skip + 1}–{skip + sessions.length} of {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || isFetching}
                onClick={() => setSkip(skip + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive chat session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session will be marked as archived. It is not deleted and can
              still be viewed when filtering by status=archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!archiveTarget) return;
                archiveMutation.mutate(archiveTarget.id, {
                  onSettled: () => setArchiveTarget(null),
                });
              }}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
