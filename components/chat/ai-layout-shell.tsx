'use client';

import { DataStreamProvider } from '@/components/chat/data-stream-provider';
import { ThemeProvider } from '@/providers/chat-theme-provider';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useUser } from '@/context/UserContext';

export function AiLayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const isCollapsed = true;

  const mappedUser = user
    ? {
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        id: user.id,
        role: user.role,
        status: user.status,
      }
    : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DataStreamProvider>
        <SidebarProvider
          defaultOpen={!isCollapsed}
          dir="ltr"
          className="min-h-0 h-[calc(100dvh-4rem)]"
        >
          <SidebarInset className="min-h-0 overflow-hidden p-0">
            {children}
          </SidebarInset>
          <AppSidebar user={mappedUser} />
        </SidebarProvider>
      </DataStreamProvider>
    </ThemeProvider>
  );
}
