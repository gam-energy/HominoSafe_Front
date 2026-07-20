'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Bell, Shield, Eye, LineChart } from 'lucide-react';
import {
  useDashboardPrefs,
  type DashboardPrefs,
} from '@/features/settings/hooks/useDashboardPrefs';
import { disableWebPush, enableWebPush } from '@/lib/web-push';

type ToggleSetting = {
  id: string;
  label: string;
  description?: string;
  default: boolean;
  prefKey?: keyof DashboardPrefs;
};

export default function SettingsViewPage() {
  const { t } = useTranslation();
  const { prefs, setPref, ready } = useDashboardPrefs();
  const [pushStatus, setPushStatus] = useState<string>('');
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#notifications') return;
    const el = document.getElementById('notifications');
    if (el) {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      const result = await enableWebPush();
      if (result === 'ok') {
        setPushStatus(t('web_push_enabled', 'Browser push enabled'));
      } else if (result === 'denied') {
        setPushStatus(t('web_push_denied', 'Notification permission denied'));
      } else if (result === 'disabled') {
        setPushStatus(
          t(
            'web_push_not_configured',
            'Web Push is not configured on the server yet (VAPID keys). In-app alerts still work.',
          ),
        );
      } else {
        setPushStatus(t('web_push_unsupported', 'Web Push not supported in this browser'));
      }
    } catch {
      setPushStatus(t('web_push_failed', 'Failed to enable Web Push'));
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setPushBusy(true);
    try {
      await disableWebPush();
      setPushStatus(t('web_push_disabled', 'Browser push disabled'));
    } catch {
      setPushStatus(t('web_push_failed', 'Failed to disable Web Push'));
    } finally {
      setPushBusy(false);
    }
  };

  const settingSections: {
    id: string;
    title: string;
    icon: typeof Bell;
    description: string;
    settings: ToggleSetting[];
  }[] = [
    {
      id: 'notifications',
      title: t('notifications', 'Notifications'),
      icon: Bell,
      description: t(
        'notifications_desc',
        'Manage how you receive alerts and updates. Critical alerts also go to system admins in-app (no SMS/email required).',
      ),
      settings: [
        {
          id: 'email_alerts',
          label: t('email_alerts', 'Email Alerts (unavailable)'),
          description: t('email_unavailable', 'No email service configured yet.'),
          default: false,
        },
        {
          id: 'sms_alerts',
          label: t('sms_alerts', 'SMS Alerts (unavailable)'),
          description: t('sms_unavailable', 'No SMS service configured yet.'),
          default: false,
        },
      ],
    },
    {
      id: 'reports_charts',
      title: t('reports_charts', 'Reports & Charts'),
      icon: LineChart,
      description: t(
        'reports_charts_desc',
        'Customize how dashboard overview KPIs and history charts appear',
      ),
      settings: [
        {
          id: 'show_all_charts',
          prefKey: 'showAllCharts',
          label: t(
            'show_all_charts',
            'Show all overview KPIs on one page (no vitals/environment filter)',
          ),
          description: t(
            'show_all_charts_desc',
            'Display wearable and environment cards together on the overview.',
          ),
          default: false,
        },
        {
          id: 'show_all_history_charts',
          prefKey: 'showAllHistoryCharts',
          label: t(
            'show_all_history_charts',
            'Show all history charts at once (no metric filter)',
          ),
          description: t(
            'show_all_history_charts_desc',
            'Stack every metric chart on the overview instead of picking one series.',
          ),
          default: false,
        },
        {
          id: 'compact_charts',
          prefKey: 'compactCharts',
          label: t('compact_charts', 'Compact charts on mobile'),
          description: t(
            'compact_charts_desc',
            'Smaller KPI cards and chart heights for phones and narrow screens.',
          ),
          default: true,
        },
      ],
    },
    {
      id: 'privacy',
      title: t('privacy_security', 'Privacy & Security'),
      icon: Shield,
      description: t('privacy_desc', 'Control your data and account security'),
      settings: [
        {
          id: 'two_factor',
          label: t('two_factor', 'Two-Factor Authentication'),
          default: false,
        },
        {
          id: 'data_sharing',
          label: t('data_sharing', 'Share anonymized health data'),
          default: true,
        },
      ],
    },
    {
      id: 'display',
      title: t('display', 'Display'),
      icon: Eye,
      description: t('display_desc', 'Customize your viewing experience'),
      settings: [
        {
          id: 'high_contrast',
          label: t('high_contrast', 'High Contrast Mode'),
          default: false,
        },
        {
          id: 'compact_view',
          label: t('compact_view', 'Compact Dashboard'),
          default: false,
        },
      ],
    },
  ];

  return (
    <div className="w-full min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('settings', 'Settings')}
          </h1>
          <p className="font-medium text-muted-foreground">
            {t(
              'settings_subtitle',
              'Manage your application preferences and account security',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                id={section.id}
                className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardHeader className="border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-border bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
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
                    {section.id === 'notifications' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('browser_web_push', 'Browser Web Push')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t(
                              'browser_web_push_desc',
                              'Receive Critical/High alerts even when the tab is in the background (no SMS required).',
                            )}
                          </p>
                          {pushStatus && (
                            <p className="mt-1 text-xs text-muted-foreground">{pushStatus}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleEnablePush} disabled={pushBusy}>
                            {t('enable', 'Enable')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDisablePush}
                            disabled={pushBusy}
                          >
                            {t('disable', 'Disable')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {section.settings.map((setting) => {
                      const isPersisted = !!setting.prefKey;
                      const checked = isPersisted
                        ? prefs[setting.prefKey!]
                        : setting.default;

                      return (
                        <div
                          key={setting.id}
                          className="flex items-start justify-between gap-4"
                        >
                          <div className="space-y-0.5 pe-4">
                            <Label
                              htmlFor={setting.id}
                              className="cursor-pointer text-sm font-medium text-foreground"
                            >
                              {setting.label}
                            </Label>
                            {setting.description && (
                              <p className="text-xs text-muted-foreground">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          <Checkbox
                            id={setting.id}
                            checked={ready || !isPersisted ? checked : false}
                            disabled={
                              (isPersisted && !ready) ||
                              setting.id === 'email_alerts' ||
                              setting.id === 'sms_alerts'
                            }
                            onCheckedChange={(v) => {
                              if (!setting.prefKey) return;
                              setPref(setting.prefKey, v === true);
                            }}
                          />
                        </div>
                      );
                    })}
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
