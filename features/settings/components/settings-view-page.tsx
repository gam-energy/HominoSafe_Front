"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { Bell, Shield, Eye } from "lucide-react";

export default function SettingsViewPage() {
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#notifications") return;
    const el = document.getElementById("notifications");
    if (el) {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const settingSections = [
    {
      id: "notifications",
      title: t("notifications", "Notifications"),
      icon: Bell,
      description: t("notifications_desc", "Manage how you receive alerts and updates"),
      settings: [
        { id: "email_alerts", label: t("email_alerts", "Email Alerts"), default: true },
        { id: "push_notifications", label: t("push_notifications", "Push Notifications"), default: true },
        { id: "sms_alerts", label: t("sms_alerts", "SMS Alerts"), default: false },
      ],
    },
    {
      id: "privacy",
      title: t("privacy_security", "Privacy & Security"),
      icon: Shield,
      description: t("privacy_desc", "Control your data and account security"),
      settings: [
        { id: "two_factor", label: t("two_factor", "Two-Factor Authentication"), default: false },
        { id: "data_sharing", label: t("data_sharing", "Share anonymized health data"), default: true },
      ],
    },
    {
      id: "display",
      title: t("display", "Display"),
      icon: Eye,
      description: t("display_desc", "Customize your viewing experience"),
      settings: [
        { id: "high_contrast", label: t("high_contrast", "High Contrast Mode"), default: false },
        { id: "compact_view", label: t("compact_view", "Compact Dashboard"), default: false },
      ],
    },
  ];

  return (
    <div className="w-full py-8 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("settings", "Settings")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("settings_subtitle", "Manage your application preferences and account security")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {settingSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden"
              >
                <CardHeader className="border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 border border-border">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-xs font-medium">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {section.settings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                          <Label htmlFor={setting.id} className="text-sm font-medium text-foreground cursor-pointer">
                            {setting.label}
                          </Label>
                        </div>
                        <Checkbox id={setting.id} defaultChecked={setting.default} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
