'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: string;
  glowColor?: string;
  /** Smaller padding/type for mobile-friendly overview grids. */
  compact?: boolean;
}

export function KpiCard({
  title,
  value,
  unit,
  icon: Icon,
  color = 'text-primary',
  glowColor = 'bg-primary/10',
  compact = false,
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:rounded-3xl',
        compact
          ? 'gap-2 p-3 sm:gap-3 sm:p-4'
          : 'gap-3 p-4 sm:gap-3.5 sm:p-5'
      )}
    >
      <div className="absolute right-0 top-0 -z-10 h-16 w-16 rounded-bl-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div
        className={cn(
          'rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 sm:rounded-2xl',
          compact ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3',
          color,
          glowColor
        )}
      >
        <Icon
          className={cn(compact ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6')}
          strokeWidth={1.8}
        />
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
          {title}
        </span>
        <div
          className={cn(
            'mt-0.5 flex items-baseline bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text font-black tracking-tight text-transparent ltr-nums dark:from-zinc-100 dark:to-zinc-300',
            compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {value}
          {unit && (
            <span className="mb-0.5 ms-1 self-end text-[10px] font-semibold text-muted-foreground sm:text-xs">
              {unit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
