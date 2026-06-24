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

export default function ProfileCard() {
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
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700 p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-xl h-full">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-blue-50 dark:border-zinc-700 shadow-md">
            <AvatarImage src="/placeholder-user.png" alt={user.first_name} />
            <AvatarFallback className="text-xl bg-blue-600 text-white">
              {user.first_name[0]}
              {user.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className={cn("absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-800", statusColor)} />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {user.first_name} {user.last_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">@{user.username}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
          <Phone className="w-4 h-4 text-blue-500" />
          <span>+98 913 104 6553</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
          <Mail className="w-4 h-4 text-blue-500" />
          <span>{user.email || 'No email provided'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Weight', value: '68', unit: 'kg' },
          { label: 'Height', value: '167', unit: 'cm' },
          { label: 'Age', value: '48', unit: 'yrs' },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{item.label}</span>
            <div className="font-bold text-sm">
              {item.value}<span className="text-[10px] ml-0.5 font-normal text-muted-foreground">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Link href="/dashboard/profile" className="w-full">
          <Button variant="outline" className="w-full rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all group">
            <Edit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            Edit Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};
