"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

import {
  X,
  Bell,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ExternalLink,
  Settings,
} from "lucide-react";

import { useNotifications } from "@/context/NotificationContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const SETTINGS_NOTIFICATIONS_HREF = "/dashboard/settings#notifications";

const severityIcons: Record<string, typeof AlertCircle> = {
  CRITICAL: AlertCircle,
  HIGH: AlertCircle,
  MEDIUM: AlertTriangle,
  LOW: Info,
};

const severityStyles: Record<string, string> = {
  CRITICAL: "text-rose-700 dark:text-rose-300 bg-rose-600/15 ring-1 ring-rose-500/40",
  HIGH: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
  MEDIUM: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  LOW: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
};

function alertsPageForRole(role: string): string {
  if (role === "doctor") return "/dashboard/patient-alert";
  return "/dashboard/alert";
}

export function AlertBar() {
  const { t, i18n } = useTranslation();
  const { role } = useUser();

  const {
    notifications,
    unreadCount,
    removeNotification,
    markAsRead,
    clearNotifications,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = notifications.filter(
    (n) => activeTab === "ALL" || n.severity === activeTab
  );

  const count = {
    ALL: notifications.length,
    CRITICAL: notifications.filter((n) => n.severity === "CRITICAL").length,
    HIGH: notifications.filter((n) => n.severity === "HIGH").length,
    MEDIUM: notifications.filter((n) => n.severity === "MEDIUM").length,
    LOW: notifications.filter((n) => n.severity === "LOW").length,
  };

  const alertsHref = alertsPageForRole(role);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 shrink-0 rounded-full"
          aria-label={t("notifications", "Notifications")}
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="flex w-[min(100vw-1.5rem,22rem)] max-h-[min(85vh,34rem)] flex-col overflow-hidden p-0 sm:w-96"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Bell className="h-4 w-4 shrink-0 text-primary" />
            <p className="truncate text-sm font-bold">
              {t("health_alerts", "Health Alerts")}
            </p>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                {notifications.length}
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={clearNotifications}
              aria-label={t("clear_all", "Clear all")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="shrink-0 px-3 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-5 gap-0.5 overflow-hidden p-1">
              {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((severity) => (
                <TabsTrigger
                  key={severity}
                  value={severity}
                  className="min-w-0 truncate rounded-md px-1 py-1.5 text-[10px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="truncate">
                    {severity === "ALL"
                      ? t("all", "All")
                      : severity === "CRITICAL"
                        ? t("crit_short", "Crit")
                        : severity.slice(0, 3)}{" "}
                    ({count[severity]})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Native overflow — Radix ScrollArea max-h alone often fails to clip */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="rounded-full bg-muted p-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("no_alerts_available", "No alerts available")}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((n) => {
                const Icon = severityIcons[n.severity] || Info;
                const isExpanded = expanded === n.id;
                const title =
                  n.message ||
                  n.alert_type?.replace(/_/g, " ") ||
                  t("health_alert", "Health Alert");

                return (
                  <li key={n.id} className="min-w-0">
                    <Card
                      className={cn(
                        "overflow-hidden rounded-lg border shadow-none",
                        !n.read && "border-primary/30 bg-accent/30"
                      )}
                    >
                      <CardHeader
                        className="flex cursor-pointer flex-row items-start justify-between gap-2 space-y-0 p-3"
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          setExpanded(isExpanded ? null : n.id);
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <div
                            className={cn(
                              "shrink-0 rounded-md p-1.5",
                              severityStyles[n.severity]
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5 overflow-hidden">
                            <CardTitle
                              className={cn(
                                "text-xs font-semibold leading-snug break-words",
                                !isExpanded && "line-clamp-2"
                              )}
                            >
                              {title}
                            </CardTitle>
                            <CardDescription className="truncate text-[10px]">
                              {n.location && `${n.location} · `}
                              {n.timestamp &&
                                new Date(n.timestamp).toLocaleString(
                                  i18n.language
                                )}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(n.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </div>
                      </CardHeader>

                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <CardContent className="space-y-1 overflow-hidden border-t px-3 pb-3 pt-2 text-[11px] text-muted-foreground break-words">
                            <p>
                              <span className="font-semibold text-foreground">
                                {t("severity", "Severity")}:
                              </span>{" "}
                              {n.severity}
                            </p>
                            {n.sensor && (
                              <p>
                                <span className="font-semibold text-foreground">
                                  {t("sensor", "Sensor")}:
                                </span>{" "}
                                {n.sensor}
                              </p>
                            )}
                            {n.message && isExpanded ? (
                              <p className="whitespace-pre-wrap">{n.message}</p>
                            ) : null}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-lg"
            asChild
          >
            <Link
              href={SETTINGS_NOTIFICATIONS_HREF}
              onClick={() => setOpen(false)}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("notification_settings", "Notification Settings")}
              </span>
            </Link>
          </Button>
          <Button size="sm" className="w-full gap-2 rounded-lg" asChild>
            <Link href={alertsHref} onClick={() => setOpen(false)}>
              <span className="truncate">
                {t("view_all_alerts", "View All Alerts")}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
