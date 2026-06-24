import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 flex flex-col items-center justify-center gap-3",
        "bg-white dark:bg-zinc-900/50",
        "shadow-sm hover:shadow-md transition-all duration-300 group",
      )}
    >
      <div className={cn(
        "p-3 rounded-full bg-gray-50 dark:bg-zinc-800/50 group-hover:scale-110 transition-transform duration-300",
        color || "text-blue-600 dark:text-blue-400"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="text-3xl font-bold mt-1 tracking-tight">
          {value}
          {unit && (
            <span className="text-sm font-medium text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
