'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type AuthBrandProps = {
  className?: string;
  size?: 'sm' | 'md';
};

export function AuthBrand({ className, size = 'md' }: AuthBrandProps) {
  const logo = size === 'sm' ? 32 : 36;
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="rounded-xl border border-border/60 bg-white p-1.5 shadow-sm dark:bg-zinc-900">
        <Image
          src="/assets/images/logo.png"
          alt=""
          width={logo}
          height={logo}
          className="rounded-lg"
          priority
        />
      </div>
      <p
        className={cn(
          'font-semibold tracking-tight text-zinc-900 dark:text-white',
          size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl'
        )}
      >
        SenioSentry
      </p>
    </div>
  );
}
