'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { useUser } from '@/context/UserContext';
import { roleNavItems } from '@/constant/data';
import { Icons } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMenu2, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useUser();

  if (!user) return null;

  const role = user.role as keyof typeof roleNavItems;
  const navItems = roleNavItems[role] ?? [];

  if (navItems.length === 0) return null;

  // For the patient, we select up to 4 main items, and the 5th is "More"
  // For other roles, we can show their items + Profile + More
  const displayItems = [...navItems];
  const hasMore = displayItems.length > 4;

  // Let's take the first 4 items for the bar, and leave the rest for the drawer
  const mainItems = hasMore ? displayItems.slice(0, 4) : displayItems;

  return (
    <div
      style={{ marginBottom: 'var(--app-sab, 0px)' }}
      className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-white/20 bg-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70">
        <nav className="flex items-center justify-around px-2 py-2">
          {mainItems.map((item) => {
            const Icon = item.icon ? Icons[item.icon] : Icons.logo;
            // Handle URL matches (e.g. active states)
            const isActive = pathname === item.url || (item.url !== '#' && pathname?.startsWith(item.url));
            const translatedTitle = t(item.title.toLowerCase().replace(/\s+/g, '_'), item.title);

            return (
              <Link
                key={item.title}
                href={item.url === '#' ? (item.items?.[0]?.url || '#') : item.url}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl py-1.5 px-3 transition-all duration-300 active:scale-90",
                  isActive 
                    ? "text-primary dark:text-blue-400" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBubble"
                    className="absolute inset-0 -z-10 rounded-xl bg-primary/10 dark:bg-blue-500/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="mb-1"
                >
                  {Icon && <Icon className="h-5.5 w-5.5" stroke={1.8} />}
                </motion.div>
                
                <span className="text-[10px] font-semibold tracking-wide truncate max-w-[64px]">
                  {translatedTitle}
                </span>
              </Link>
            );
          })}

          {/* Profile item if small list, or standard "More" menu button */}
          {hasMore ? (
            <button
              onClick={() => setOpenMobile(true)}
              className="flex flex-col items-center justify-center rounded-xl py-1.5 px-3 text-muted-foreground transition-all duration-300 active:scale-90 hover:text-foreground"
            >
              <div className="mb-1">
                <IconMenu2 className="h-5.5 w-5.5 text-muted-foreground" stroke={1.8} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">
                {t('more', 'More')}
              </span>
            </button>
          ) : (
            <Link
              href="/dashboard/profile"
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl py-1.5 px-3 transition-all duration-300 active:scale-90",
                pathname === '/dashboard/profile'
                  ? "text-primary dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {pathname === '/dashboard/profile' && (
                <motion.div
                  layoutId="activeBubble"
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/10 dark:bg-blue-500/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="mb-1">
                <IconUser className="h-5.5 w-5.5" stroke={1.8} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">
                {t('profile', 'Profile')}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
