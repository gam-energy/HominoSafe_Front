'use client';

import { Chat } from '@/components/chat/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { DataStreamHandler } from '@/components/chat/data-stream-handler';
import { ChatKnowledgeGate } from '@/components/chat/chat-knowledge-gate';
import { useCreateSession } from '@/features/ai/api/useCreateSession';
import { useState, useEffect, useMemo } from 'react';
import { GetSessions } from '@/features/ai/api/useGetSessions';
import { GetChatById } from '@/features/ai/api/useGetChatById';
import { LoaderIcon } from '@/components/chat/icons';
import { useUser } from '@/context/UserContext';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const patientId = useMemo(() => {
    if (!patientIdParam) return undefined;
    const n = Number(patientIdParam);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [patientIdParam]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const { mutate: createSession } = useCreateSession();
  const { data: Sessions, isLoading: sessionsLoading } = GetSessions();

  const sessionsArray = Sessions?.sessions || [];
  const sortedSessions = [...sessionsArray].sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.created_at).getTime() -
      new Date(a.last_message_at ?? a.created_at).getTime()
  );

  // When scoped to a patient, always start a fresh patient-bound session.
  const lastSession = patientId ? null : sortedSessions[0];

  const { data: lastSessionChat, isLoading: chatLoading } = GetChatById(
    lastSession?.session_id || ''
  );

  useEffect(() => {
    // Reset when patient scope changes so we create the right session.
    setChecked(false);
    setSessionId(null);
  }, [patientId]);

  useEffect(() => {
    if (sessionsLoading || chatLoading || checked) return;

    if (patientId) {
      createSession(
        { patient_id: patientId },
        {
          onSuccess: (data) => {
            if (data?.session_id) {
              setSessionId(data.session_id);
              setChecked(true);
            }
          },
        }
      );
      return;
    }

    if (!lastSession) {
      createSession(undefined, {
        onSuccess: (data) => {
          if (data?.session_id) {
            setSessionId(data.session_id);
            setChecked(true);
          }
        },
      });
    } else if (!lastSessionChat?.messages?.length) {
      setSessionId(lastSession.session_id);
      setChecked(true);
    } else {
      createSession(undefined, {
        onSuccess: (data) => {
          if (data?.session_id) {
            setSessionId(data.session_id);
            setChecked(true);
          }
        },
      });
    }
  }, [
    sessionsLoading,
    chatLoading,
    lastSession,
    lastSessionChat,
    createSession,
    checked,
    patientId,
  ]);

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <span className="text-lg text-muted-foreground">Loading user...</span>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
          <LoaderIcon size={40} />
        </div>
        <span className="text-lg text-muted-foreground">
          {patientId
            ? `Preparing AI chat for patient #${patientId}...`
            : 'Preparing chat screen...'}
        </span>
      </div>
    );
  }

  return (
    <ChatKnowledgeGate userId={user.id}>
      <Chat
        key={sessionId}
        id={sessionId}
        initialMessages={{ messages: [], session_id: sessionId }}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler />
    </ChatKnowledgeGate>
  );
}
