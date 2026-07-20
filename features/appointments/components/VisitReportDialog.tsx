'use client';

import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCompleteAppointmentWithReport,
  type AppointmentSummary,
  type VisitMedicationEntry,
  type VisitProfileUpdate,
} from '../api/use-appointments';

interface VisitReportDialogProps {
  open: boolean;
  appt: AppointmentSummary | null;
  onClose: () => void;
}

function localNowInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const VisitReportDialog: FC<VisitReportDialogProps> = ({ open, appt, onClose }) => {
  const { t } = useTranslation();
  const complete = useCompleteAppointmentWithReport();

  const [clinicalNote, setClinicalNote] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [physicianNotes, setPhysicianNotes] = useState('');
  const [demographics, setDemographics] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [meds, setMeds] = useState<VisitMedicationEntry[]>([]);

  useEffect(() => {
    if (open) {
      setClinicalNote('');
      setDiagnosis('');
      setPhysicianNotes('');
      setDemographics('');
      setComorbidities('');
      setMeds([]);
    }
  }, [open, appt?.id]);

  const addMed = () => {
    setMeds((prev) => [
      ...prev,
      {
        name: '',
        dosage: '',
        frequency: '',
        start_date: new Date().toISOString(),
        end_date: null,
        notes: null,
      },
    ]);
  };

  const updateMed = (idx: number, patch: Partial<VisitMedicationEntry>) => {
    setMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeMed = (idx: number) => {
    setMeds((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit =
    !!appt && clinicalNote.trim().length > 0 && !complete.isPending;

  const handleSubmit = async () => {
    if (!appt) return;
    const profileUpdates: VisitProfileUpdate = {};
    if (diagnosis.trim()) profileUpdates.diagnosis = diagnosis.trim();
    if (physicianNotes.trim()) profileUpdates.physician_notes = physicianNotes.trim();
    if (demographics.trim()) profileUpdates.demographics = demographics.trim();
    if (comorbidities.trim()) {
      try {
        profileUpdates.comorbidities = JSON.parse(comorbidities.trim());
      } catch {
        profileUpdates.comorbidities = { note: comorbidities.trim() };
      }
    }

    const cleanMeds = meds
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        start_date: m.start_date,
        end_date: m.end_date || null,
        notes: m.notes || null,
      }));

    await complete.mutateAsync({
      id: appt.id,
      payload: {
        clinical_note: clinicalNote.trim(),
        profile_updates:
          Object.keys(profileUpdates).length > 0 ? profileUpdates : null,
        medications: cleanMeds.length > 0 ? cleanMeds : null,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('visit_report_title', 'Visit report & complete')}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
          <div>
            <Label htmlFor="clinical-note">
              {t('visit_report_clinical_note', 'Clinical note')}
              <span className="text-rose-500"> *</span>
            </Label>
            <Textarea
              id="clinical-note"
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              rows={5}
              placeholder={t(
                'visit_report_note_placeholder',
                'Summary, findings, plan… the agent extracts extra changes from this note.',
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                'visit_report_note_hint',
                'Required. The agent will also extract additional profile/medication changes from this note.',
              )}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-semibold">
              {t('visit_report_profile_section', 'Profile updates (optional)')}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>{t('visit_report_diagnosis', 'Diagnosis')}</Label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('visit_report_demographics', 'Demographics')}</Label>
                <Input
                  value={demographics}
                  onChange={(e) => setDemographics(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('visit_report_physician_notes', 'Physician notes')}</Label>
                <Textarea
                  value={physicianNotes}
                  onChange={(e) => setPhysicianNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('visit_report_comorbidities', 'Comorbidities (JSON or note)')}</Label>
                <Input
                  value={comorbidities}
                  onChange={(e) => setComorbidities(e.target.value)}
                  placeholder='{"diabetes": true}'
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">
                {t('visit_report_meds_section', 'Medications (optional)')}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={addMed}>
                <Plus className="me-1 h-4 w-4" />
                {t('visit_report_add_med', 'Add medication')}
              </Button>
            </div>
            {meds.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t(
                  'visit_report_meds_empty',
                  'No structured medications. Add them only if you want to upsert specific rows; the agent can also infer meds from the note.',
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {meds.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-md border bg-muted/30 p-2 sm:grid-cols-3"
                  >
                    <div className="sm:col-span-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-rose-600"
                        onClick={() => removeMed(idx)}
                      >
                        <Trash2 className="me-1 h-3.5 w-3.5" />
                        {t('remove', 'Remove')}
                      </Button>
                    </div>
                    <div>
                      <Label>{t('visit_report_med_name', 'Name')}</Label>
                      <Input
                        value={m.name}
                        onChange={(e) => updateMed(idx, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t('visit_report_med_dosage', 'Dosage')}</Label>
                      <Input
                        value={m.dosage}
                        onChange={(e) => updateMed(idx, { dosage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t('visit_report_med_frequency', 'Frequency')}</Label>
                      <Input
                        value={m.frequency}
                        onChange={(e) => updateMed(idx, { frequency: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t('visit_report_med_start', 'Start date')}</Label>
                      <Input
                        type="datetime-local"
                        value={m.start_date ? localNowInput() : ''}
                        onChange={(e) =>
                          updateMed(idx, {
                            start_date: toIso(e.target.value) || m.start_date,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>{t('visit_report_med_end', 'End date')}</Label>
                      <Input
                        type="datetime-local"
                        value={m.end_date ? '' : ''}
                        onChange={(e) =>
                          updateMed(idx, { end_date: toIso(e.target.value) })
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label>{t('visit_report_med_notes', 'Notes')}</Label>
                      <Input
                        value={m.notes || ''}
                        onChange={(e) => updateMed(idx, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={complete.isPending}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {complete.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('visit_report_submit_complete', 'Submit & complete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VisitReportDialog;
