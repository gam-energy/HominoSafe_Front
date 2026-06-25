"use client"
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function PageContainer({
  children,
  scrollable = true,
  className,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
}) {
  const content = (
    <div className={cn('flex flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-6', className)}>
      {children}
    </div>
  );

  return scrollable ? (
    <ScrollArea className="h-[calc(100dvh-52px)]">
      {content}
    </ScrollArea>
  ) : (
    content
  );
}
