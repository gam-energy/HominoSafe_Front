import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import  AssistantModal  from '@/components/ui/assistant-ui/assistant-modal';
import { LayoutSidebarProvider } from '@/context/SidebarContext';
import { NotificationProvider } from '@/context/NotificationContext';


export const metadata: Metadata = {
  title: 'SenioSentry Dashboard',
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
      <SidebarInset className="min-w-0 overflow-x-hidden pb-24 md:pb-0">
        <AssistantModal />
        <Header />
        {/* page main content */}
        {children}
        {/* page main content ends */}
        <MobileBottomNav />
      </SidebarInset>
      </NotificationProvider>
      </LayoutSidebarProvider>
    </SidebarProvider>
  );
}
