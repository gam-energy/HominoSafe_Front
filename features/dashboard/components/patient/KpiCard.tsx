"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: string;
  glowColor?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  icon: Icon,
  color = "text-primary",
  glowColor = "bg-primary/10",
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 p-5 flex flex-col items-center justify-center gap-3.5",
        "shadow-sm hover:shadow-md transition-all duration-300 group dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md",
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon Wrapper with subtle pulsing on hover */}
      <div className={cn(
        "p-3 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-sm",
        color,
        glowColor
      )}>
        <Icon className="w-6 h-6" strokeWidth={1.8} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">{title}</span>
        <div className="text-3xl font-black mt-0.5 tracking-tight ltr-nums bg-gradient-to-r from-gray-900 to-gray-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent flex items-baseline">
          {value}
          {unit && (
            <span className="text-xs font-semibold text-muted-foreground ms-1 self-end mb-1">
              {unit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
