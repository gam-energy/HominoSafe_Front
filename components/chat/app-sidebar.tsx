'use client';

import { useRouter } from 'next/navigation';
import { useCreateSession } from '@/features/ai/api/useCreateSession'; 

import { PlusIcon } from '@/components/chat/icons';
import { SidebarHistory } from '@/components/chat/sidebar-history';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { User } from '@/features/profile/types/user';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate: createSession } = useCreateSession();

  const handleCreateSession = () => {
    createSession(undefined, {
      onSuccess: (data) => {
        if (data?.session_id) {
          setOpenMobile(false);
          router.push(`/dashboard/ai/chat/${data.session_id}`);
          router.refresh();
          console.log('✅ Session created with ID:', data.session_id);
        }
      },
      onError: (error) => {
        console.error('❌ Failed to create session:', error);
      },
    });
  };

  return (
    <Sidebar
      side="right"
      className="[&_[data-slot=sidebar-container]]:top-16 [&_[data-slot=sidebar-container]]:h-[calc(100dvh-4rem)] [&_[data-slot=sidebar-container]]:z-20 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="#"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={handleCreateSession}
                  title="Add new session"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className='m-auto font-light opacity-80'>Powered by Gam</SidebarFooter>
    </Sidebar>
  );
}
