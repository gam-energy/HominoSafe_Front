'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ChatHeader from '@/components/chat/chat-header';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/chat/use-artifact';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/chat/use-chat-visibility';
import type { Attachment, ChatMessage } from '@/lib/types';
import type { Message } from '@/features/ai/types/chat';
import { useAutoResume } from '@/hooks/chat/use-auto-resume';
import { useChatWebSocket } from '@/features/ai/api/useChatWebSocket';
import { useUpdateSession } from '@/features/ai/api/useUpdateSession';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';

export interface Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
    role?: string;
  };
  expires: string;
}

function mapRestMessages(data: Message): ChatMessage[] {
  if (!data?.messages?.length) return [];
  return data.messages.map((msg) => ({
    id: `${msg.timestamp}-${msg.role}`,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }],
    content: msg.content,
    timestamp: msg.timestamp,
  }));
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session: sessionProp,
  autoResume,
}: {
  id: string;
  initialMessages: Message;
  initialChatModel: string;
  initialVisibilityType?: VisibilityType;
  isReadonly?: boolean;
  session?: Session;
  autoResume: boolean;
}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { mutate: updateSession } = useUpdateSession();
  const hasTitledRef = useRef(false);

  const session: Session = sessionProp ?? {
    user: {
      name: user ? `${user.first_name} ${user.last_name}`.trim() : null,
      email: user?.email ?? null,
      id: user?.id?.toString(),
      role: user?.role,
    },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  };

  const handleMessageSent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  }, [queryClient]);

  const { messages, status, sendMessage, isHistoryLoaded } = useChatWebSocket(
    id,
    { onMessageSent: handleMessageSent }
  );

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const [input, setInput] = useState<string>('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(() =>
    mapRestMessages(initialMessages)
  );

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (!isHistoryLoaded && initialMessages?.messages?.length) {
      setLocalMessages(mapRestMessages(initialMessages));
    }
  }, [initialMessages, isHistoryLoaded]);

  useEffect(() => {
    if (hasTitledRef.current) return;
    const firstUser = messages.find((m) => m.role === 'user');
    const hasAssistant = messages.some((m) => m.role === 'assistant');
    if (firstUser && hasAssistant && firstUser.content) {
      const title = firstUser.content.slice(0, 40).trim();
      if (title) {
        updateSession({ sessionId: id, title });
        hasTitledRef.current = true;
      }
    }
  }, [messages, id, updateSession]);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage(query);
      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/dashboard/ai/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  useAutoResume({
    autoResume,
    initialMessages: mapRestMessages(initialMessages),
    reload: async () => null,
    setMessages: (msgs) => {
      if (typeof msgs === 'function') {
        setLocalMessages((prev) => msgs(prev) as ChatMessage[]);
      } else {
        setLocalMessages(
          msgs.map((msg) => ('data' in msg ? msg.data : msg) as ChatMessage)
        );
      }
    },
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly ?? false}
          session={session}
        />
        <Messages
          chatId={id}
          status={status as 'submitted' | 'streaming' | 'ready' | 'error'}
          messages={localMessages.map((msg) =>
            'parts' in msg ? msg : { ...msg, parts: [] }
          )}
          setMessages={(msgs) =>
            setLocalMessages(
              (Array.isArray(msgs)
                ? msgs.map((msg) => ('data' in msg ? msg.data : msg))
                : []) as ChatMessage[]
            )
          }
          isReadonly={isReadonly ?? false}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status as 'submitted' | 'streaming' | 'ready' | 'error'}
              stop={() => {}}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={localMessages.map((msg) =>
                'parts' in msg ? msg : { ...msg, parts: [] }
              )}
              setMessages={(msgs) =>
                setLocalMessages(
                  (Array.isArray(msgs)
                    ? msgs.map((msg) => ('data' in msg ? msg.data : msg))
                    : []) as ChatMessage[]
                )
              }
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status as 'submitted' | 'streaming' | 'ready' | 'error'}
        stop={() => {}}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={localMessages}
        setMessages={(msgs) => {
          if (typeof msgs === 'function') {
            setLocalMessages((prev) => msgs(prev) as ChatMessage[]);
          } else {
            setLocalMessages(
              msgs.map((msg) => ('data' in msg ? msg.data : msg) as ChatMessage)
            );
          }
        }}
        regenerate={async () => null}
        append={async () => {}}
        isReadonly={isReadonly ?? false}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
