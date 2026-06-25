"use client";

import { useUser } from '@/context/UserContext';
import { CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Phone, Mail, Sparkles, Scale, Ruler, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function ProfileCard() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const isRtl = (i18n.language || 'en').startsWith('fa');

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-sm border p-8 backdrop-blur-md">
        No user data available.
      </div>
    );
  }

  const isOnline = user.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden flex h-full flex-col gap-6 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md group"
    >
      {/* Decorative background gradient */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10 dark:from-blue-500/10 dark:via-blue-500/5" />

      <div className="flex flex-col items-center text-center gap-4 pt-4">
        {/* Avatar with Ring */}
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-md group-hover:ring-primary/40 transition-all duration-300">
            <AvatarImage src="/placeholder-user.png" alt={user.first_name} />
            <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-primary to-primary-hover text-white">
              {user.first_name[0]}
              {user.last_name[0]}
            </AvatarFallback>
          </Avatar>
          
          {/* Online/Offline status dot with pulse */}
          <span className="absolute bottom-1 right-1 flex h-4.5 w-4.5 rounded-full border-2 border-white dark:border-zinc-900 bg-background items-center justify-center">
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5", 
              isOnline ? "bg-emerald-500" : "bg-amber-500"
            )}>
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
          </span>
        </div>

        {/* Name and Username */}
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
            {user.first_name} {user.last_name}
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </CardTitle>
          <p className="text-xs font-semibold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
            {t('patient_role', 'Patient')} • @{user.username}
          </p>
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-300">
          <Phone className="w-4 h-4 text-primary" />
          <span className="ltr-nums font-semibold">+98 913 104 6553</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-300">
          <Mail className="w-4 h-4 text-primary" />
          <span className="truncate font-semibold">{user.email || 'No email provided'}</span>
        </div>
      </div>

      {/* Stats Boxes (Glassmorphic) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('weight', 'Weight'), value: '68', unit: 'kg', icon: Scale, color: "text-blue-500 bg-blue-500/10" },
          { label: t('height', 'Height'), value: '167', unit: 'cm', icon: Ruler, color: "text-violet-500 bg-violet-500/10" },
          { label: t('age', 'Age'), value: '48', unit: 'yrs', icon: CalendarDays, color: "text-amber-500 bg-amber-500/10" },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <div 
              key={item.label} 
              className="bg-muted/40 dark:bg-zinc-800/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-zinc-800/60 shadow-sm hover:shadow transition-all duration-300"
            >
              <div className={cn("p-1.5 rounded-xl", item.color)}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">{item.label}</span>
                <div className="font-bold text-sm ltr-nums text-gray-800 dark:text-zinc-200">
                  {item.value}
                  <span className="text-[10px] ms-0.5 font-normal text-muted-foreground">{item.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Button */}
      <div className="mt-auto pt-4">
        <Link href="/dashboard/profile" className="w-full">
          <Button variant="outline" className="w-full rounded-2xl h-11 hover:bg-primary hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border-zinc-200 dark:border-zinc-800 hover:border-transparent transition-all duration-300 group">
            <Edit className="w-4 h-4 me-2 group-hover:rotate-12 transition-transform duration-300" />
            {t('edit_profile', 'Edit Profile')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
