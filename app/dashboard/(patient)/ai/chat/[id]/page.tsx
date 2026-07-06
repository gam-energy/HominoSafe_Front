'use client';

import { useParams } from 'next/navigation';
import { Chat } from '@/components/chat/chat';
import { DataStreamHandler } from '@/components/chat/data-stream-handler';
import { ChatKnowledgeGate } from '@/components/chat/chat-knowledge-gate';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { GetChatById } from '@/features/ai/api/useGetChatById';
import { notFound } from 'next/navigation';
import { LoaderIcon } from '@/components/chat/icons';
import { useUser } from '@/context/UserContext';

export default function ChatPage() {
  const { user } = useUser();
  const params = useParams();
  const id =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : '';

  const { data, isLoading, error } = GetChatById(id);

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <span className="text-lg text-muted-foreground">Loading user...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
          <LoaderIcon size={40} />
        </div>
        <span className="text-lg text-muted-foreground">Loading chat...</span>
      </div>
    );
  }

  if (error || !data) return notFound();

  return (
    <ChatKnowledgeGate userId={user.id}>
      <Chat
        id={data.session_id}
        initialMessages={data}
        initialChatModel={DEFAULT_CHAT_MODEL}
        autoResume
      />
      <DataStreamHandler />
    </ChatKnowledgeGate>
  );
}
