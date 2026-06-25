'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { roleNavItems } from '@/constant/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { useSignOut } from '@/features/auth/api/use-sign-out';
import { useUser } from '@/context/UserContext';
import type { NavItem } from '@/types';
import { BriefcaseMedical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise',
};

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' },
];

export default function AppSidebar() {
  const { t, i18n } = useTranslation();
  const isRtl = (i18n.language || 'en').startsWith('fa');
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const logoutMutation = useSignOut();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.role as keyof typeof roleNavItems;

  
  const navItems: NavItem[] = roleNavItems[role] ?? [];
  
  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };
  
  const activeTenant = tenants[0];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  
  
  if (!user || !role || navItems.length === 0) {
    return null; // یا spinner
  }
  return (
    <Sidebar collapsible="icon" side={isRtl ? 'right' : 'left'}>
        {/* <OrgSwitcher
          tenants={tenants}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        /> */}
      <SidebarHeader className="flex items-center gap-2 px-4 py-3 text-primary font-semibold text-lg">
        <BriefcaseMedical className="w-5 h-5"/>
        {isOpen && <span className="truncate">SenioSentry</span>}
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>{t('overview', 'Overview')}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;

              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={t(item.title.toLowerCase().replace(/\s+/g, '_'), item.title)}
                        isActive={pathname === item.url}
                      >
                        {Icon && <Icon />}
                        <span>{t(item.title.toLowerCase().replace(/\s+/g, '_'), item.title)}</span>
                        <IconChevronRight
                          data-chevron
                          className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{t(subItem.title.toLowerCase().replace(/\s+/g, '_'), subItem.title)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={t(item.title.toLowerCase().replace(/\s+/g, '_'), item.title)}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      {Icon && <Icon />}
                      <span>{t(item.title.toLowerCase().replace(/\s+/g, '_'), item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {user && (
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-white"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="px-1 py-1.5">
                    {user && (
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className="me-2 h-4 w-4" />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className="me-2 h-4 w-4" />
                    {t('billing', 'Billing')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className="me-2 h-4 w-4" />
                    {t('notifications', 'Notifications')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconLogout className="me-2 h-4 w-4" />
                  <div onClick={handleLogout}>{t('logout')}</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
