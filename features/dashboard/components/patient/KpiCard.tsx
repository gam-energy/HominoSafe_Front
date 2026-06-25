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
        "rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-center gap-3",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group",
      )}
    >
      <div className={cn(
        "p-3 rounded-full bg-muted group-hover:scale-110 transition-transform duration-300",
        color || "text-primary"
      )}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="text-3xl font-bold mt-1 tracking-tight ltr-nums">
          {value}
          {unit && (
            <span className="text-sm font-medium text-muted-foreground ms-1">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
