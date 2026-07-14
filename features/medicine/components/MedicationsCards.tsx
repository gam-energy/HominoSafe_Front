'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Pill, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MedicationReminder,
  useUpdateMedicationReminders,
} from '../api/useMedicationReminders';

interface Props {
  medications: MedicationReminder[];
  timezone?: string;
}

const MedicationsCards: React.FC<Props> = ({ medications, timezone }) => {
  const { t } = useTranslation();

  if (medications.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t('no_medications')}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {medications.map((med) => (
        <CardItem key={med.id} med={med} timezone={timezone} />
      ))}
    </div>
  );
};

const CardItem = ({
  med,
  timezone,
}: {
  med: MedicationReminder;
  timezone?: string;
}) => {
  const { t } = useTranslation();
  const update = useUpdateMedicationReminders();
  const [times, setTimes] = useState<string[]>(med.reminder_times ?? []);
  const [draft, setDraft] = useState('08:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimes(med.reminder_times ?? []);
  }, [med.reminder_times]);

  const dirty =
    JSON.stringify([...times].sort()) !==
    JSON.stringify([...(med.reminder_times ?? [])].sort());

  const addTime = () => {
    setError(null);
    const m = draft.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
      setError(t('invalid_reminder_time', 'Use HH:MM, e.g. 08:00'));
      return;
    }
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour > 23 || minute > 59) {
      setError(t('invalid_reminder_time', 'Use HH:MM, e.g. 08:00'));
      return;
    }
    const normalized = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (times.includes(normalized)) return;
    setTimes((prev) => [...prev, normalized].sort());
  };

  const removeTime = (value: string) => {
    setTimes((prev) => prev.filter((t) => t !== value));
  };

  const save = () => {
    if (times.length === 0) {
      setError(t('reminder_times_required', 'Add at least one reminder time'));
      return;
    }
    update.mutate(
      {
        medicationId: Number(med.id),
        reminder_times: times,
        timezone: med.timezone || timezone,
      },
      {
        onError: () =>
          setError(t('reminder_save_failed', 'Could not save reminder times')),
      }
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/30">
          <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-bold text-foreground">{med.name}</h3>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{t('dosage')}:</span>{' '}
          {med.dosage}
        </p>
        <p>
          <span className="font-semibold text-foreground">{t('frequency')}:</span>{' '}
          {med.frequency}
        </p>
      </div>

      {med.notes && (
        <p className="mt-1 text-xs italic text-muted-foreground border-s-2 border-blue-500/50 ps-2.5">
          {med.notes}
        </p>
      )}

      <div className="mt-1 border-t border-border pt-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          {t('reminder_times', 'Reminder times')}
          {(med.timezone || timezone) && (
            <span className="font-normal text-muted-foreground">
              ({med.timezone || timezone})
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {times.map((time) => (
            <span
              key={time}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
            >
              {time}
              <button
                type="button"
                onClick={() => removeTime(time)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${time}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {times.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {t('no_reminder_times', 'No times set')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 w-[8.5rem] text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={addTime}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 ms-auto"
            disabled={!dirty || update.isPending || times.length === 0}
            onClick={save}
          >
            {update.isPending
              ? t('saving', 'Saving…')
              : t('save_reminders', 'Save')}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {update.isSuccess && !dirty && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {t('reminders_saved', 'Reminders saved')}
          </p>
        )}
      </div>
    </div>
  );
};

export default MedicationsCards;
