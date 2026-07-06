'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from '../ui/sidebar';
import { SidebarTrigger } from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { useCreateSession } from '@/features/ai/api/useCreateSession';
import { useSidebarContext } from '@/context/SidebarContext';
import { CustomSidebarToggle } from '../layout/CustomSidebarToggle';

function ChatHeader() {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
    const {
    toggleMainSidebar
  } = useSidebarContext();
  const { mutate: createSession } = useCreateSession();

const handleCreateSession = () => {
  createSession(undefined, {
    onSuccess: (data) => {
      if (data?.session_id) {
        toggleMainSidebar()
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
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {/* <SidebarToggle /> */}
      <CustomSidebarToggle/>
      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={handleCreateSession}
              title="New Chat"
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}

export default ChatHeader;
