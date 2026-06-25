"use client";

import { useUser } from '@/context/UserContext';
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Circle, Edit, User, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function ProfileCard() {
  const { t } = useTranslation();
  const { user } = useUser();

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8">
        No user data available.
      </div>
    );
  }

  const statusColor =
    user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-md">
            <AvatarImage src="/placeholder-user.png" alt={user.first_name} />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {user.first_name[0]}
              {user.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className={cn("absolute bottom-1 end-1 h-4 w-4 rounded-full border-2 border-card", statusColor)} />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {user.first_name} {user.last_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">@{user.username}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted transition-colors">
          <Phone className="w-4 h-4 text-primary" />
          <span className="ltr-nums">+98 913 104 6553</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted transition-colors">
          <Mail className="w-4 h-4 text-primary" />
          <span>{user.email || 'No email provided'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t('weight', 'Weight'), value: '68', unit: 'kg' },
          { label: t('height', 'Height'), value: '167', unit: 'cm' },
          { label: t('age', 'Age'), value: '48', unit: 'yrs' },
        ].map((item) => (
          <div key={item.label} className="bg-muted p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-transparent hover:border-primary/20 transition-all">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{item.label}</span>
            <div className="font-bold text-sm ltr-nums">
              {item.value}<span className="text-[10px] ms-0.5 font-normal text-muted-foreground">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Link href="/dashboard/profile" className="w-full">
          <Button variant="outline" className="w-full rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all group">
            <Edit className="w-4 h-4 me-2 group-hover:rotate-12 transition-transform" />
            {t('edit_profile', 'Edit Profile')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
