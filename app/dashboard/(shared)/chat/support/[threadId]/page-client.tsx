'use client';

import { useParams } from 'next/navigation';
import SupportChatPanel from '@/features/support/components/SupportChatPanel';

export default function SupportThreadPageClient() {
  const { threadId } = useParams<{ threadId: string }>();
  const id = Number(threadId);
  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Invalid thread
      </div>
    );
  }
  return <SupportChatPanel threadId={id} />;
}
