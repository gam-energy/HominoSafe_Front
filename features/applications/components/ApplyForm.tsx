'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { relationships } from '@/features/auth/types/auth';
import { useCreateApplication, usePublicClinics } from '../api/use-applications';
import { GENDERS, type Gender } from '../types/applications';
import { cn } from '@/lib/utils';

const RELATION_KEYS: Record<string, string> = {
  Parent: 'rel_parent',
  Spouse: 'rel_spouse',
  Sibling: 'rel_sibling',
  Child: 'rel_child',
  Friend: 'rel_friend',
  Relative: 'rel_relative',
  Caregiver: 'rel_caregiver',
  Other: 'rel_other',
};

type FormState = {
  caregiver: {
    username: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    relationship_to_patient: string;
  };
  patient: {
    username: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    national_code: string;
    dob: string;
    gender: Gender | '';
    weight: string;
    height: string;
  };
  clinic_id: number | null;
};

const initialForm: FormState = {
  caregiver: {
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    relationship_to_patient: '',
  },
  patient: {
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_code: '',
    dob: '',
    gender: '',
    weight: '',
    height: '',
  },
  clinic_id: null,
};

const STEPS = ['caregiver', 'patient', 'clinic'] as const;

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pe-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function ApplyForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: clinics, isLoading: clinicsLoading, error: clinicsError } = usePublicClinics();
  const createApp = useCreateApplication();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState({
    cg: false,
    cgConfirm: false,
    pt: false,
    ptConfirm: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedClinic = useMemo(
    () => clinics?.find((c) => c.id === form.clinic_id) ?? null,
    [clinics, form.clinic_id]
  );

  const setCaregiver = (key: keyof FormState['caregiver'], value: string) => {
    setForm((prev) => ({
      ...prev,
      caregiver: { ...prev.caregiver, [key]: value },
    }));
  };

  const setPatient = (key: keyof FormState['patient'], value: string) => {
    setForm((prev) => ({
      ...prev,
      patient: { ...prev.patient, [key]: value },
    }));
  };

  const validateCaregiver = (): boolean => {
    const e: Record<string, string> = {};
    const c = form.caregiver;
    if (!c.first_name.trim()) e.cg_first_name = t('err_name_required');
    if (!c.last_name.trim()) e.cg_last_name = t('err_name_required');
    if (!c.username.trim()) e.cg_username = t('err_username_password_required');
    if (!c.password) e.cg_password = t('err_username_password_required');
    else if (c.password.length < 8) e.cg_password = t('err_password_min');
    if (c.password !== c.confirmPassword) e.cg_confirm = t('err_password_mismatch');
    if (!c.relationship_to_patient) e.cg_rel = t('err_relationship_required');
    if (!c.email.trim()) e.cg_email = t('err_email_required', 'Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) {
      e.cg_email = t('err_email_invalid', 'Enter a valid email');
    }
    if (!c.phone_number.trim() || c.phone_number.trim().length < 5) {
      e.cg_phone = t('err_phone_required', 'Phone number is required');
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePatient = (): boolean => {
    const e: Record<string, string> = {};
    const p = form.patient;
    if (!p.first_name.trim()) e.pt_first_name = t('err_name_required');
    if (!p.last_name.trim()) e.pt_last_name = t('err_name_required');
    if (!p.username.trim()) e.pt_username = t('err_username_password_required');
    if (!p.password) e.pt_password = t('err_username_password_required');
    else if (p.password.length < 8) e.pt_password = t('err_password_min');
    if (p.password !== p.confirmPassword) e.pt_confirm = t('err_password_mismatch');
    if (!p.national_code.trim()) e.pt_national = t('err_national_code_required', 'National code is required');
    if (!p.dob) e.pt_dob = t('err_dob_required', 'Date of birth is required');
    if (!p.gender) e.pt_gender = t('err_gender_required', 'Please select gender');
    if (p.weight && Number.isNaN(Number(p.weight))) e.pt_weight = t('err_number_invalid', 'Enter a valid number');
    if (p.height && Number.isNaN(Number(p.height))) e.pt_height = t('err_number_invalid', 'Enter a valid number');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateClinic = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.clinic_id) e.clinic = t('err_clinic_required', 'Please select a clinic');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateCaregiver()) return;
    if (step === 1 && !validatePatient()) return;
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateClinic() || !form.clinic_id || !form.patient.gender) return;

    const payload = {
      clinic_id: form.clinic_id,
      caregiver: {
        username: form.caregiver.username.trim(),
        password: form.caregiver.password,
        first_name: form.caregiver.first_name.trim(),
        last_name: form.caregiver.last_name.trim(),
        relationship_to_patient: form.caregiver.relationship_to_patient,
        email: form.caregiver.email.trim(),
        phone_number: form.caregiver.phone_number.trim(),
      },
      patient: {
        username: form.patient.username.trim(),
        password: form.patient.password,
        first_name: form.patient.first_name.trim(),
        last_name: form.patient.last_name.trim(),
        national_code: form.patient.national_code.trim(),
        dob: form.patient.dob,
        gender: form.patient.gender,
        ...(form.patient.email.trim() ? { email: form.patient.email.trim() } : {}),
        ...(form.patient.phone_number.trim()
          ? { phone_number: form.patient.phone_number.trim() }
          : {}),
        ...(form.patient.weight ? { weight: Number(form.patient.weight) } : {}),
        ...(form.patient.height ? { height: Number(form.patient.height) } : {}),
      },
    };

    try {
      await createApp.mutateAsync(payload);
      setSubmitted(true);
      toast.success(t('app_submit_success', 'Application submitted successfully'));
      setTimeout(() => {
        router.push(
          `/auth/sign-in?message=${encodeURIComponent('application_submitted')}`
        );
      }, 1200);
    } catch {
      // toast handled in mutation
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h2 className="text-xl font-bold">{t('app_submit_success_title', 'Application submitted')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('app_submit_success_body', 'Redirecting you to sign in…')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <nav className="mb-8 flex items-center justify-between gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                i === step && 'bg-primary text-primary-foreground',
                i < step && 'bg-emerald-500 text-white',
                i > step && 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                i === step ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {t(`app_step_${s}`, s)}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 hidden h-px flex-1 bg-border sm:block" aria-hidden />
            )}
          </div>
        ))}
      </nav>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_caregiver', 'Caregiver account')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('app_step_caregiver_desc', 'Create your caregiver login and contact details.')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cg_first_name">{t('first_name')}</Label>
              <Input
                id="cg_first_name"
                value={form.caregiver.first_name}
                onChange={(e) => setCaregiver('first_name', e.target.value)}
              />
              {fieldErrors.cg_first_name && (
                <p className="text-xs text-destructive">{fieldErrors.cg_first_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_last_name">{t('last_name')}</Label>
              <Input
                id="cg_last_name"
                value={form.caregiver.last_name}
                onChange={(e) => setCaregiver('last_name', e.target.value)}
              />
              {fieldErrors.cg_last_name && (
                <p className="text-xs text-destructive">{fieldErrors.cg_last_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_username">{t('username')}</Label>
              <Input
                id="cg_username"
                dir="ltr"
                value={form.caregiver.username}
                onChange={(e) => setCaregiver('username', e.target.value)}
                autoComplete="username"
              />
              {fieldErrors.cg_username && (
                <p className="text-xs text-destructive">{fieldErrors.cg_username}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_email">{t('email')}</Label>
              <Input
                id="cg_email"
                dir="ltr"
                type="email"
                value={form.caregiver.email}
                onChange={(e) => setCaregiver('email', e.target.value)}
                required
              />
              {fieldErrors.cg_email && (
                <p className="text-xs text-destructive">{fieldErrors.cg_email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg_phone">{t('phone_number')}</Label>
              <Input
                id="cg_phone"
                dir="ltr"
                value={form.caregiver.phone_number}
                onChange={(e) => setCaregiver('phone_number', e.target.value)}
                required
              />
              {fieldErrors.cg_phone && (
                <p className="text-xs text-destructive">{fieldErrors.cg_phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('relationship_to_patient')}</Label>
              <Select
                value={form.caregiver.relationship_to_patient}
                onValueChange={(v) => setCaregiver('relationship_to_patient', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select_relationship')} />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {t(RELATION_KEYS[rel] || rel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.cg_rel && (
                <p className="text-xs text-destructive">{fieldErrors.cg_rel}</p>
              )}
            </div>
            <PasswordField
              id="cg_password"
              label={t('password')}
              value={form.caregiver.password}
              onChange={(v) => setCaregiver('password', v)}
              show={showPw.cg}
              onToggle={() => setShowPw((s) => ({ ...s, cg: !s.cg }))}
              placeholder={t('enter_password')}
            />
            {fieldErrors.cg_password && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.cg_password}</p>
            )}
            <PasswordField
              id="cg_confirm"
              label={t('confirm_password')}
              value={form.caregiver.confirmPassword}
              onChange={(v) => setCaregiver('confirmPassword', v)}
              show={showPw.cgConfirm}
              onToggle={() => setShowPw((s) => ({ ...s, cgConfirm: !s.cgConfirm }))}
              placeholder={t('reenter_password')}
            />
            {fieldErrors.cg_confirm && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.cg_confirm}</p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_patient', 'Patient profile')}</h2>
            <p className="text-sm text-muted-foreground">
              {t(
                'app_step_patient_desc',
                'Enter the patient profile and create their account credentials.'
              )}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pt_first_name">{t('first_name')}</Label>
              <Input
                id="pt_first_name"
                value={form.patient.first_name}
                onChange={(e) => setPatient('first_name', e.target.value)}
              />
              {fieldErrors.pt_first_name && (
                <p className="text-xs text-destructive">{fieldErrors.pt_first_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_last_name">{t('last_name')}</Label>
              <Input
                id="pt_last_name"
                value={form.patient.last_name}
                onChange={(e) => setPatient('last_name', e.target.value)}
              />
              {fieldErrors.pt_last_name && (
                <p className="text-xs text-destructive">{fieldErrors.pt_last_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_username">{t('username')}</Label>
              <Input
                id="pt_username"
                dir="ltr"
                value={form.patient.username}
                onChange={(e) => setPatient('username', e.target.value)}
              />
              {fieldErrors.pt_username && (
                <p className="text-xs text-destructive">{fieldErrors.pt_username}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_national">{t('national_code', 'National code')}</Label>
              <Input
                id="pt_national"
                dir="ltr"
                value={form.patient.national_code}
                onChange={(e) => setPatient('national_code', e.target.value)}
              />
              {fieldErrors.pt_national && (
                <p className="text-xs text-destructive">{fieldErrors.pt_national}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_dob">{t('date_of_birth', 'Date of birth')}</Label>
              <Input
                id="pt_dob"
                type="date"
                dir="ltr"
                value={form.patient.dob}
                onChange={(e) => setPatient('dob', e.target.value)}
              />
              {fieldErrors.pt_dob && (
                <p className="text-xs text-destructive">{fieldErrors.pt_dob}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('gender', 'Gender')}</Label>
              <Select
                value={form.patient.gender}
                onValueChange={(v) => setPatient('gender', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select_gender', 'Select gender')} />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {t(`gender_${g.toLowerCase()}`, g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.pt_gender && (
                <p className="text-xs text-destructive">{fieldErrors.pt_gender}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_email">{t('email')} ({t('optional', 'optional')})</Label>
              <Input
                id="pt_email"
                dir="ltr"
                type="email"
                value={form.patient.email}
                onChange={(e) => setPatient('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_phone">{t('phone_number')} ({t('optional', 'optional')})</Label>
              <Input
                id="pt_phone"
                dir="ltr"
                value={form.patient.phone_number}
                onChange={(e) => setPatient('phone_number', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_weight">{t('weight_kg', 'Weight (kg)')} ({t('optional', 'optional')})</Label>
              <Input
                id="pt_weight"
                dir="ltr"
                type="number"
                inputMode="decimal"
                value={form.patient.weight}
                onChange={(e) => setPatient('weight', e.target.value)}
              />
              {fieldErrors.pt_weight && (
                <p className="text-xs text-destructive">{fieldErrors.pt_weight}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt_height">{t('height_cm', 'Height (cm)')} ({t('optional', 'optional')})</Label>
              <Input
                id="pt_height"
                dir="ltr"
                type="number"
                inputMode="decimal"
                value={form.patient.height}
                onChange={(e) => setPatient('height', e.target.value)}
              />
              {fieldErrors.pt_height && (
                <p className="text-xs text-destructive">{fieldErrors.pt_height}</p>
              )}
            </div>
            <PasswordField
              id="pt_password"
              label={t('password')}
              value={form.patient.password}
              onChange={(v) => setPatient('password', v)}
              show={showPw.pt}
              onToggle={() => setShowPw((s) => ({ ...s, pt: !s.pt }))}
            />
            {fieldErrors.pt_password && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.pt_password}</p>
            )}
            <PasswordField
              id="pt_confirm"
              label={t('confirm_password')}
              value={form.patient.confirmPassword}
              onChange={(v) => setPatient('confirmPassword', v)}
              show={showPw.ptConfirm}
              onToggle={() => setShowPw((s) => ({ ...s, ptConfirm: !s.ptConfirm }))}
            />
            {fieldErrors.pt_confirm && (
              <p className="text-xs text-destructive sm:col-span-2">{fieldErrors.pt_confirm}</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t('app_step_clinic', 'Clinic & review')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('app_step_clinic_desc', 'Choose a clinic and confirm your application.')}
            </p>
          </div>

          {clinicsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading_clinics', 'Loading clinics…')}
            </div>
          )}
          {clinicsError && (
            <p className="text-sm text-destructive">
              {t('err_load_clinics', 'Could not load clinics. Please try again.')}
            </p>
          )}

          <div className="grid gap-3">
            {(clinics ?? []).map((clinic) => {
              const selected = form.clinic_id === clinic.id;
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, clinic_id: clinic.id }))}
                  className={cn(
                    'rounded-xl border p-4 text-start transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  <p className="font-semibold">{clinic.name}</p>
                  {clinic.address && (
                    <p className="mt-1 text-sm text-muted-foreground">{clinic.address}</p>
                  )}
                  {clinic.phone && (
                    <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                      {clinic.phone}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          {fieldErrors.clinic && (
            <p className="text-xs text-destructive">{fieldErrors.clinic}</p>
          )}

          <div className="mt-6 space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
            <h3 className="font-semibold">{t('app_review_summary', 'Review summary')}</h3>
            <p>
              <span className="text-muted-foreground">{t('caregiver')}: </span>
              {form.caregiver.first_name} {form.caregiver.last_name} (@{form.caregiver.username})
            </p>
            <p>
              <span className="text-muted-foreground">{t('patient', 'Patient')}: </span>
              {form.patient.first_name} {form.patient.last_name} (@{form.patient.username})
            </p>
            <p>
              <span className="text-muted-foreground">{t('clinic', 'Clinic')}: </span>
              {selectedClinic?.name ?? '—'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
          {t('back', 'Back')}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            {t('continue', 'Continue')}
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={createApp.isPending}>
            {createApp.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('submitting', 'Submitting…')}
              </>
            ) : (
              t('submit_application', 'Submit application')
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
