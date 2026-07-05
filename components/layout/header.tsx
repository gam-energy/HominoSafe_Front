import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { LanguageToggle } from './language-toggle';
import { AlertBar } from '@/features/dashboard/components/patient/AlertBar';
// import CtaGithub from './cta-github';

export default function Header() {
  // const { toggleSidebar } = useSidebar()

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-zinc-100 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md sticky top-0 z-30'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ms-1 hidden md:flex' />
        <Separator orientation='vertical' className='me-2 h-4 hidden md:block' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-1 px-4'>
        <AlertBar />
        <LanguageToggle />
        <UserNav />
        <ModeToggle />
        {/* <ThemeSelector /> */}
      </div>
    </header>
  );
}
