'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, RefreshCw, Trash2, Watch } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  MY_DEVICES_QUERY_KEY,
  useDevicePair,
  useDeviceRevoke,
  useMyDevices,
  type PairedDevice,
} from '@/features/dashboard/api/patient/useDeviceLogin';
import { useDeviceLoginWebSocket } from '@/features/dashboard/hooks/useDeviceLoginWebSocket';
import type { DevicePairResponse } from '@/features/profile/types/profile';
import { cn } from '@/lib/utils';
import { ActivityMeter } from './ActivityMeter';

function getPairCode(data?: DevicePairResponse | null): string | null {
  if (!data) return null;
  return data.otp ?? data.pairing_code ?? data.code ?? null;
}

function getExpiresSeconds(data?: DevicePairResponse | null): number | null {
  if (!data) return null;
  if (data.expires_in_seconds != null) return data.expires_in_seconds;
  if (data.expires_in != null) return data.expires_in;
  return null;
}

type View = 'list' | 'pair';

export function PairWatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: devicesData, isLoading: devicesLoading } = useMyDevices(open);
  const pairMutation = useDevicePair();
  const revokeMutation = useDeviceRevoke();
  const [pairData, setPairData] = useState<DevicePairResponse | null>(null);
  const [view, setView] = useState<View>('list');
  const [confirmRevokeId, setConfirmRevokeId] = useState<number | null>(null);

  const devices = devicesData?.devices ?? [];
  const hasDevices = devices.length > 0;

  const requestPairing = useCallback(() => {
    pairMutation.mutate(undefined, {
      onSuccess: (data) => {
        setPairData(data);
        if (!getPairCode(data)) {
          toast.message(
            t('pairing_started', 'Pairing request sent. Check your watch for a code.')
          );
        }
      },
      onError: () => {
        toast.error(t('pairing_failed', 'Failed to generate pairing code.'));
      },
    });
  }, [pairMutation, t]);

  const startPairing = useCallback(() => {
    setView('pair');
    setPairData(null);
    requestPairing();
  }, [requestPairing]);

  useEffect(() => {
    if (!open) {
      setPairData(null);
      setView('list');
      setConfirmRevokeId(null);
      return;
    }
    // Empty list → go straight to OTP; otherwise show management list.
    if (!devicesLoading) {
      if (!hasDevices) {
        startPairing();
      } else {
        setView('list');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, devicesLoading, hasDevices]);

  const handlePairSuccess = useCallback(
    (_deviceId?: string | null) => {
      toast.success(t('pairing_success', 'Smart watch paired successfully'));
      queryClient.invalidateQueries({ queryKey: MY_DEVICES_QUERY_KEY });
      setPairData(null);
      setView('list');
      onOpenChange(false);
    },
    [onOpenChange, queryClient, t]
  );

  useDeviceLoginWebSocket(open && view === 'pair', handlePairSuccess);

  const code = getPairCode(pairData);
  const expiresSeconds = getExpiresSeconds(pairData);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('copied', 'Copied to clipboard'));
    } catch {
      toast.error(t('copy_failed', 'Could not copy code'));
    }
  };

  const handleRevoke = (device: PairedDevice) => {
    if (confirmRevokeId !== device.id) {
      setConfirmRevokeId(device.id);
      return;
    }
    revokeMutation.mutate(
      { credential_id: device.id },
      {
        onSuccess: () => {
          toast.success(t('device_revoked', 'Device unlinked'));
          setConfirmRevokeId(null);
        },
        onError: () => {
          toast.error(t('device_revoke_failed', 'Could not unlink device'));
          setConfirmRevokeId(null);
        },
      }
    );
  };

  const title =
    view === 'pair' || !hasDevices
      ? t('connect_smartwatch', 'Connect Smart Watch')
      : t('manage_smartwatch', 'Manage Smart Watch');

  const description =
    view === 'pair'
      ? t(
          'connect_smartwatch_desc',
          'Enter this one-time code on your watch to link it to your account.'
        )
      : t(
          'manage_smartwatch_desc',
          'Paired watches for your account. Unlink a device to revoke its access.'
        );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {view === 'list' && hasDevices ? (
          <div className="flex flex-col gap-3 py-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-3"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate ltr" dir="ltr">
                      {device.device_id}
                    </p>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        device.online
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      {device.online
                        ? t('watch_online', 'Online')
                        : t('watch_offline', 'Watch offline')}
                    </span>
                  </div>
                  {device.mqtt_username && (
                    <p className="text-xs text-muted-foreground ltr truncate" dir="ltr">
                      {t('mqtt_user', 'MQTT')}: {device.mqtt_username}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('paired_on', 'Paired')}{' '}
                    {new Date(device.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('last_seen', 'Last seen')}:{' '}
                    {device.last_seen_at
                      ? new Date(device.last_seen_at).toLocaleString()
                      : t('never', 'Never')}
                  </p>
                  {(device.activity || (device.activity_intensity ?? 0) > 0) && (
                    <div className="pt-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        {t('body_activity', 'Body activity')}
                      </p>
                      <ActivityMeter
                        activity={device.activity}
                        intensity={device.activity_intensity}
                        bodyPosition={device.body_position}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant={confirmRevokeId === device.id ? 'destructive' : 'outline'}
                  size="sm"
                  disabled={revokeMutation.isPending}
                  onClick={() => handleRevoke(device)}
                  className="shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  {confirmRevokeId === device.id
                    ? t('confirm_unlink', 'Confirm')
                    : t('unlink_device', 'Unlink')}
                </Button>
              </div>
            ))}
            <Button className="w-full rounded-xl mt-1" onClick={startPairing}>
              <Plus className="h-4 w-4 me-1" />
              {t('add_smartwatch', 'Add another watch')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            {pairMutation.isPending && !code ? (
              <div className="text-sm text-muted-foreground">
                {t('generating_code', 'Generating pairing code...')}
              </div>
            ) : code ? (
              <>
                <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-8 py-6">
                  <p className="text-4xl font-black tracking-[0.3em] text-center ltr-nums">
                    {code}
                  </p>
                </div>
                {pairData?.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    {t('expires_at', 'Expires')}:{' '}
                    {new Date(pairData.expires_at).toLocaleTimeString()}
                  </p>
                )}
                {expiresSeconds != null && !pairData?.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    {t('expires_in_seconds', 'Expires in {{seconds}} seconds', {
                      seconds: expiresSeconds,
                    })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {t(
                    'waiting_for_watch',
                    'Waiting for the watch to confirm… this dialog updates automatically.'
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 me-1" />
                    {t('copy_code', 'Copy code')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestPairing}
                    disabled={pairMutation.isPending}
                  >
                    <RefreshCw
                      className={`h-4 w-4 me-1 ${pairMutation.isPending ? 'animate-spin' : ''}`}
                    />
                    {t('new_code', 'New code')}
                  </Button>
                </div>
                {hasDevices && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setView('list');
                      setPairData(null);
                    }}
                  >
                    {t('back_to_devices', 'Back to devices')}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {pairData?.message ??
                    t(
                      'pairing_pending',
                      'Waiting for the watch to confirm pairing. You can request a new code if needed.'
                    )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPairing}
                  disabled={pairMutation.isPending}
                >
                  <RefreshCw
                    className={`h-4 w-4 me-1 ${pairMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  {t('request_new_code', 'Request new code')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
