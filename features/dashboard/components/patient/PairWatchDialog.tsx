'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw, Watch } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDevicePair } from '@/features/dashboard/api/patient/useDeviceLogin';
import type { DevicePairResponse } from '@/features/profile/types/profile';

function getPairCode(data?: DevicePairResponse | null): string | null {
  if (!data) return null;
  return data.otp ?? data.pairing_code ?? data.code ?? null;
}

export function PairWatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const pairMutation = useDevicePair();
  const [pairData, setPairData] = useState<DevicePairResponse | null>(null);

  const requestPairing = () => {
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
  };

  useEffect(() => {
    if (open) {
      requestPairing();
    } else {
      setPairData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const code = getPairCode(pairData);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('copied', 'Copied to clipboard'));
    } catch {
      toast.error(t('copy_failed', 'Could not copy code'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-primary" />
            {t('connect_smartwatch', 'Connect Smart Watch')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'connect_smartwatch_desc',
              'Enter this one-time code on your watch to link it to your account.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {pairMutation.isPending ? (
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
              {pairData?.expires_in != null && !pairData.expires_at && (
                <p className="text-xs text-muted-foreground">
                  {t('expires_in_seconds', 'Expires in {{seconds}} seconds', {
                    seconds: pairData.expires_in,
                  })}
                </p>
              )}
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
      </DialogContent>
    </Dialog>
  );
}
