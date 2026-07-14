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
    <div
      className={cn(
        'mx-auto flex w-full min-w-0 max-w-[1920px] flex-1 flex-col p-4 md:p-6',
        className
      )}
    >
      {children}
    </div>
  );

  return scrollable ? (
    <ScrollArea className="h-[calc(100dvh-52px)] min-w-0 w-full overflow-x-hidden">
      {content}
    </ScrollArea>
  ) : (
    content
  );
}
