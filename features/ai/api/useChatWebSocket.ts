import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { getChatWsUrl } from '@/lib/api-utils';
import { refreshAccessToken } from '@/api/axiosInstance';
import type { MessageItem } from '../types/chat';
import { normalizeMessageText } from '../utils/normalizeMessageText';

type ChatMessage = {
  id: string;
  role: string;
  parts: Array<{ type: string; text: string }>;
  content: string;
  timestamp: string;
  type?: string;
};

function extractContentText(input: unknown): string {
  return normalizeMessageText(input);
}

function toChatMessage(msg: MessageItem): ChatMessage {
  const content = normalizeMessageText(msg.content);

  return {
    id: `${msg.timestamp}-${msg.role}`,
    role: msg.role,
    parts: [{ type: 'text', text: content }],
    content,
    timestamp: msg.timestamp,
  };
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_MS = 1000;

export function useChatWebSocket(
  sessionId: string,
  options?: { onMessageSent?: () => void }
) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const intentionalClose = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<
    'connecting' | 'open' | 'closed' | 'error'
  >('connecting');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  const sendMessage = useCallback(
    (input: unknown) => {
      const contentText = extractContentText(input);

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ message: contentText }));

        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: 'user',
            parts: [{ type: 'text', text: contentText }],
            content: contentText,
            timestamp: new Date().toISOString(),
          },
        ]);

        options?.onMessageSent?.();
      }
    },
    [options]
  );

  const connect = useCallback(async () => {
    let token = Cookies.get('access_token');
    if (!token) {
      setStatus('error');
      return;
    }

    const socket = new WebSocket(getChatWsUrl(sessionId, token));
    ws.current = socket;

    socket.onopen = () => {
      setStatus('open');
      setWsError(null);
      reconnectAttempt.current = 0;
    };

    socket.onmessage = (event) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        parsed = { content: event.data };
      }

      if (parsed.type === 'pong') return;

      if (parsed.type === 'typing') {
        setMessages((prev) => {
          if (prev.length && prev[prev.length - 1].type === 'typing') return prev;
          return [
            ...prev,
            {
              id: uuidv4(),
              type: 'typing',
              role: 'assistant',
              parts: [{ type: 'text', text: '' }],
              content: '',
              timestamp: new Date().toISOString(),
            },
          ];
        });
        return;
      }

      if (parsed.type === 'history' && Array.isArray(parsed.messages)) {
        const historyMessages = (parsed.messages as MessageItem[])
          .map(toChatMessage)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        setMessages(historyMessages);
        setIsHistoryLoaded(true);
        return;
      }

      if (parsed.type === 'error') {
        const errorContent = String(parsed.content ?? 'An error occurred');
        setWsError(errorContent);
        toast.error(errorContent);
        setMessages((prev) =>
          prev.filter((msg) => msg.type !== 'typing')
        );
        return;
      }

      if (parsed.type === 'message' || parsed.role) {
        const contentText = extractContentText(parsed);
        const role = String(parsed.role ?? 'assistant');
        const timestamp =
          typeof parsed.timestamp === 'string'
            ? parsed.timestamp
            : new Date().toISOString();

        const newMessage: ChatMessage = {
          id: uuidv4(),
          role,
          parts: [{ type: 'text', text: contentText }],
          content: contentText,
          timestamp,
        };

        setMessages((prev) => [
          ...prev.filter((msg) => msg.type !== 'typing'),
          newMessage,
        ]);
      }
    };

    socket.onerror = () => {
      setStatus('error');
    };

    socket.onclose = async (event) => {
      if (intentionalClose.current) return;

      setStatus('closed');

      if (event.code === 1008 && reconnectAttempt.current < MAX_RECONNECT_ATTEMPTS) {
        try {
          await refreshAccessToken();
          reconnectAttempt.current += 1;
          setTimeout(() => connect(), RECONNECT_BASE_MS * reconnectAttempt.current);
          return;
        } catch {
          setWsError('Authentication expired. Please sign in again.');
          return;
        }
      }

      if (reconnectAttempt.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempt.current += 1;
        setTimeout(() => connect(), RECONNECT_BASE_MS * reconnectAttempt.current);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    intentionalClose.current = false;
    reconnectAttempt.current = 0;
    setMessages([]);
    setIsHistoryLoaded(false);
    setStatus('connecting');
    connect();

    return () => {
      intentionalClose.current = true;
      ws.current?.close();
    };
  }, [sessionId, connect]);

  return {
    messages,
    status,
    sendMessage,
    isHistoryLoaded,
    wsError,
  };
}
