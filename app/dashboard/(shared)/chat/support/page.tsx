'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/context/UserContext';
import { Spinner } from '@/components/realtime-chat/ui/spinner';
import {
  useEnsureMySupportThread,
  useSupportThreads,
} from '@/features/support/api/use-support';

export default function SupportChatEntryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, role } = useUser();
  const ensure = useEnsureMySupportThread();
  const { data: threads, isLoading } = useSupportThreads(role === 'admin');

  useEffect(() => {
    if (!user) return;
    if (role === 'admin') {
      if (!isLoading && threads?.length) {
        router.replace(`/dashboard/chat/support/${threads[0].id}`);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const thread = await ensure.mutateAsync({});
        if (!cancelled) router.replace(`/dashboard/chat/support/${thread.id}`);
      } catch {
        /* toast handled in hook */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role, isLoading, threads?.length]);

  if (role === 'admin' && !isLoading && (!threads || threads.length === 0)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        {t('support_inbox_empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="w-7 h-7" />
    </div>
  );
}
