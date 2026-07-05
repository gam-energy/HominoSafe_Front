export type MessageItem = {
  role: 'user' | 'assistant' | string;
  content: string;
  timestamp: string;
};

export type Message = {
  messages: MessageItem[];
  session_id: string;
};

export type SessionItem = {
  session_id: string;
  created_at: string;
  title?: string;
  last_message_at?: string;
  status?: 'active' | 'archived' | string;
};

export type Sessions = {
  sessions: SessionItem[];
};

export type UpdateSessionResponse = {
  session_id: string;
  title: string;
};
