'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { GetSessions } from '@/features/ai/api/useGetSessions';
import { useDeleteSession } from '@/features/ai/api/useDeleteSession';
import { Trash2Icon } from 'lucide-react';
import { User } from '@/features/profile/types/user';
import { LoaderIcon } from './icons';
import { formatRelativeTime } from '@/lib/api-utils';
import { cn } from '@/lib/utils';

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const router = useRouter();

  const { data: sessions, isLoading, error, refetch } = GetSessions();
  const { mutate: deleteSession } = useDeleteSession();

  const handleDelete = (sessionId: string) => {
    toast.promise(
      () =>
        new Promise((resolve, reject) => {
          deleteSession(sessionId, {
            onSuccess: () => {
              refetch();
              if (id === sessionId) router.push('/dashboard/ai');
              resolve(true);
            },
            onError: () => reject(new Error('Failed to delete session')),
          });
        }),
      {
        loading: 'Deleting...',
        success: 'Session archived.',
        error: 'Failed to delete session.',
      }
    );
  };

  const getSessionLabel = (title: string | undefined, index: number) => {
    if (title?.trim()) return title;
    return `Chat ${index + 1}`;
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 text-blue-500 mb-2">
              <LoaderIcon size={32} />
            </div>
            <span className="text-muted-foreground">Loading sessions...</span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-red-500 w-full flex justify-center items-center text-sm gap-2">
            Failed to load sessions.
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!sessions?.sessions?.length) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex justify-center items-center text-sm gap-2">
            No sessions found. Start a conversation!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="flex flex-col gap-2 p-2">
          <div className="text-xs text-sidebar-foreground/50">Sessions</div>
          {sessions.sessions.map((session, index) => {
            const isActive = id === session.session_id;
            const timeLabel = session.last_message_at
              ? formatRelativeTime(session.last_message_at)
              : formatRelativeTime(session.created_at);

            return (
              <div
                key={session.session_id}
                className={cn(
                  'flex items-center justify-between px-2 py-1 rounded hover:bg-sidebar-accent',
                  isActive && 'bg-sidebar-accent'
                )}
              >
                <div
                  onClick={() => {
                    router.push(`/dashboard/ai/chat/${session.session_id}`);
                    setOpenMobile(false);
                  }}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <div className="text-sm font-medium text-sidebar-foreground truncate">
                    {getSessionLabel(session.title, index)}
                  </div>
                  <div className="text-xs text-zinc-400">{timeLabel}</div>
                </div>

                <button
                  onClick={() => handleDelete(session.session_id)}
                  className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
                  title="Archive session"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
