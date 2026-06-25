import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import  AssistantModal  from '@/components/ui/assistant-ui/assistant-modal';
import { LayoutSidebarProvider } from '@/context/SidebarContext';
import { NotificationProvider } from '@/context/NotificationContext';


export const metadata: Metadata = {
  title: 'SennioSentry Dashboard',
  description: 'A Monitoring System for Elderly Care',
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LayoutSidebarProvider>
        <NotificationProvider>
      <AppSidebar />
      <SidebarInset>
        <AssistantModal />
        <Header />
        {/* page main content */}
        {children}
        {/* page main content ends */}
      </SidebarInset>
      </NotificationProvider>
      </LayoutSidebarProvider>
    </SidebarProvider>
  );
}
