'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, LifeBuoy, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { Spinner } from '@/components/realtime-chat/ui/spinner';
import {
  usePostSupportMessage,
  useSupportMessages,
  useSupportThreads,
} from '../api/use-support';

type Props = {
  threadId: number;
};

export default function SupportChatPanel({ threadId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { data: threads } = useSupportThreads(!!user);
  const { data: messages, isLoading } = useSupportMessages(threadId);
  const send = usePostSupportMessage(threadId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = threads?.find((x) => x.id === threadId);
  const title =
    user?.role === 'admin'
      ? thread?.user_name || thread?.subject || t('support_chat_admin_title')
      : t('support_chat_with_admin');
  const subtitle =
    user?.role === 'admin'
      ? t('support_chat_admin_subtitle')
      : t('support_chat_user_subtitle');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body, {
      onSuccess: () => setDraft(''),
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-4 py-2.5 z-50 h-16 shrink-0">
        <ArrowLeft
          className="w-5 h-5 lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => router.push('/dashboard/chat')}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <h5 className="font-bold text-sm text-foreground truncate">{title}</h5>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center pt-10">
            <Spinner className="w-7 h-7" />
          </div>
        ) : !messages?.length ? (
          <p className="text-sm text-muted-foreground text-center pt-10">
            {t('support_chat_empty')}
          </p>
        ) : (
          messages.map((m) => {
            const mine = user?.id === m.sender_id;
            return (
              <div
                key={m.id}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                    mine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  {!mine && m.sender_name ? (
                    <p className="text-[11px] opacity-70 mb-0.5">{m.sender_name}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-border p-3 flex items-end gap-2 bg-card"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={1}
          placeholder={t('support_chat_placeholder')}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[40px] max-h-32 focus:outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || send.isPending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          aria-label={t('support_chat_send')}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
