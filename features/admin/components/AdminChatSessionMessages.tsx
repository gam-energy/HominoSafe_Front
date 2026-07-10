'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useGetChatSessionMessages } from '../api/use-get-chat-session-messages';
import { normalizeMessageText } from '@/features/ai/utils/normalizeMessageText';

interface AdminChatSessionMessagesProps {
  sessionId: string;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function AdminChatSessionMessages({
  sessionId,
}: AdminChatSessionMessagesProps) {
  const router = useRouter();
  const { data, isLoading, error } = useGetChatSessionMessages(sessionId, {
    limit: 1000,
    offset: 0,
  });

  const messages = data?.messages ?? [];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/chat-sessions')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Button>
        <h1 className="text-xl font-bold">Chat session messages</h1>
      </div>

      <code className="text-xs text-muted-foreground">{sessionId}</code>

      <Card>
        <CardHeader>
          <CardTitle>
            {messages.length} message{messages.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">
              {error.message}
            </p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              This session has no messages.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {messages.map((m) => {
                const text = normalizeMessageText(m.content);
                const isUser = (m.role || '').toLowerCase() === 'user';
                const meta = m.metadata as
                  | { patient_id?: number; categories?: string[] }
                  | null;
                return (
                  <li
                    key={m.id}
                    className={`flex flex-col gap-1 rounded-lg border p-3 ${
                      isUser
                        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium uppercase tracking-wider">
                        {m.role}
                      </span>
                      <span>{formatDate(m.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {text || (
                        <span className="text-muted-foreground italic">
                          (empty)
                        </span>
                      )}
                    </p>
                    {meta && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {meta.patient_id != null && (
                          <Link
                            href={`/dashboard/users/${meta.patient_id}`}
                            className="inline-flex"
                          >
                            <Badge variant="outline" className="cursor-pointer">
                              patient #{meta.patient_id}
                            </Badge>
                          </Link>
                        )}
                        {(meta.categories || []).map((c) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
